const db = require('../config/database');
const { generateId } = require('../utils/helpers');

const createProject = (req, res) => {
  try {
    const { name, key, description, color, icon } = req.body;

    // Check if key exists
    const existing = db.prepare('SELECT id FROM projects WHERE key = ?').get(key.toUpperCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Project key already exists'
      });
    }

    const projectId = generateId();

    db.prepare(`
      INSERT INTO projects (id, name, key, description, owner_id, color, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, name, key.toUpperCase(), description, req.userId, color || '#6366f1', icon || 'folder');

    // Add owner as project member
    db.prepare(`
      INSERT INTO project_members (id, project_id, user_id, role)
      VALUES (?, ?, ?, 'owner')
    `).run(generateId(), projectId, req.userId);

    // Initialize ticket sequence
    db.prepare(`
      INSERT INTO ticket_sequences (project_id, last_number)
      VALUES (?, 0)
    `).run(projectId);

    // Create default board columns
    const columns = [
      { name: 'To Do', status_key: 'todo', position: 0, color: '#6b7280' },
      { name: 'In Progress', status_key: 'in_progress', position: 1, color: '#3b82f6' },
      { name: 'In Review', status_key: 'in_review', position: 2, color: '#f59e0b' },
      { name: 'Done', status_key: 'done', position: 3, color: '#10b981' }
    ];

    const insertColumn = db.prepare(`
      INSERT INTO board_columns (id, project_id, name, status_key, position, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const col of columns) {
      insertColumn.run(generateId(), projectId, col.name, col.status_key, col.position, col.color);
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
};

const getProjects = (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, u.first_name as owner_first_name, u.last_name as owner_last_name,
             (SELECT COUNT(*) FROM tickets WHERE project_id = p.id) as ticket_count,
             (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.owner_id = u.id
      WHERE pm.user_id = ?
      ORDER BY p.updated_at DESC
    `).all(req.userId);

    res.json({
      success: true,
      data: { projects }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
};

const getProject = (req, res) => {
  try {
    const { id } = req.params;

    const project = db.prepare(`
      SELECT p.*, u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get members
    const members = db.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.avatar, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(id);

    // Get board columns
    const columns = db.prepare(`
      SELECT * FROM board_columns WHERE project_id = ? ORDER BY position
    `).all(id);

    // Get ticket stats
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tickets WHERE project_id = ?
    `).get(id);

    res.json({
      success: true,
      data: {
        project: { ...project, members, columns, stats }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
};

const updateProject = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    db.prepare(`
      UPDATE projects
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          color = COALESCE(?, color),
          icon = COALESCE(?, icon),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, color, icon, id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
};

const deleteProject = (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is owner
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete the project'
      });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
};

const addMember = (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    // Check if already a member
    const existing = db.prepare(`
      SELECT id FROM project_members WHERE project_id = ? AND user_id = ?
    `).get(id, userId);

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    db.prepare(`
      INSERT INTO project_members (id, project_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `).run(generateId(), id, userId, role || 'member');

    const member = db.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.avatar, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ? AND pm.user_id = ?
    `).get(id, userId);

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { member }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding member'
    });
  }
};

const removeMember = (req, res) => {
  try {
    const { id, userId } = req.params;

    db.prepare(`
      DELETE FROM project_members WHERE project_id = ? AND user_id = ?
    `).run(id, userId);

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
};

const getBoardColumns = (req, res) => {
  try {
    const { id } = req.params;

    const columns = db.prepare(`
      SELECT * FROM board_columns WHERE project_id = ? ORDER BY position
    `).all(id);

    res.json({
      success: true,
      data: { columns }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching board columns'
    });
  }
};

const updateBoardColumns = (req, res) => {
  try {
    const { id } = req.params;
    const { columns } = req.body;

    // Delete existing columns
    db.prepare('DELETE FROM board_columns WHERE project_id = ?').run(id);

    // Insert new columns
    const insert = db.prepare(`
      INSERT INTO board_columns (id, project_id, name, status_key, position, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const col of columns) {
      insert.run(col.id || generateId(), id, col.name, col.status_key, col.position, col.color);
    }

    const updatedColumns = db.prepare(`
      SELECT * FROM board_columns WHERE project_id = ? ORDER BY position
    `).all(id);

    res.json({
      success: true,
      message: 'Board columns updated',
      data: { columns: updatedColumns }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating board columns'
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getBoardColumns,
  updateBoardColumns
};
