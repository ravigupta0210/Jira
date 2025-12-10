const db = require('../config/database');
const { generateId } = require('../utils/helpers');

const createTicket = (req, res) => {
  try {
    const { projectId, title, description, type, priority, assigneeId, parentId, storyPoints, dueDate, labels } = req.body;

    // Get next ticket number
    db.prepare('UPDATE ticket_sequences SET last_number = last_number + 1 WHERE project_id = ?').run(projectId);
    const { last_number } = db.prepare('SELECT last_number FROM ticket_sequences WHERE project_id = ?').get(projectId);

    const ticketId = generateId();

    db.prepare(`
      INSERT INTO tickets (id, ticket_number, project_id, title, description, type, priority, assignee_id, reporter_id, parent_id, story_points, due_date, labels)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticketId, last_number, projectId, title, description || '',
      type || 'task', priority || 'medium',
      assigneeId || null, req.userId, parentId || null,
      storyPoints || null, dueDate || null, labels ? JSON.stringify(labels) : null
    );

    // Log activity
    const project = db.prepare('SELECT key FROM projects WHERE id = ?').get(projectId);
    db.prepare(`
      INSERT INTO activities (id, ticket_id, project_id, user_id, action, details)
      VALUES (?, ?, ?, ?, 'created', ?)
    `).run(generateId(), ticketId, projectId, req.userId, JSON.stringify({
      ticketKey: `${project.key}-${last_number}`,
      title
    }));

    // Get created ticket with relations
    const ticket = db.prepare(`
      SELECT t.*,
             p.key as project_key,
             p.name as project_name,
             u1.first_name as assignee_first_name,
             u1.last_name as assignee_last_name,
             u1.avatar as assignee_avatar,
             u2.first_name as reporter_first_name,
             u2.last_name as reporter_last_name,
             u2.avatar as reporter_avatar
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      JOIN users u2 ON t.reporter_id = u2.id
      WHERE t.id = ?
    `).get(ticketId);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: { ticket: { ...ticket, key: `${ticket.project_key}-${ticket.ticket_number}` } }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ticket'
    });
  }
};

const getTickets = (req, res) => {
  try {
    const { projectId, status, type, priority, assigneeId, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*,
             p.key as project_key,
             p.name as project_name,
             u1.first_name as assignee_first_name,
             u1.last_name as assignee_last_name,
             u1.avatar as assignee_avatar,
             u2.first_name as reporter_first_name,
             u2.last_name as reporter_last_name
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      JOIN users u2 ON t.reporter_id = u2.id
      WHERE 1=1
    `;

    const params = [];

    if (projectId) {
      query += ' AND t.project_id = ?';
      params.push(projectId);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (assigneeId) {
      query += ' AND t.assignee_id = ?';
      params.push(assigneeId);
    }

    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = db.prepare(countQuery).get(...params);

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const tickets = db.prepare(query).all(...params).map(t => ({
      ...t,
      key: `${t.project_key}-${t.ticket_number}`
    }));

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets'
    });
  }
};

const getTicket = (req, res) => {
  try {
    const { id } = req.params;

    const ticket = db.prepare(`
      SELECT t.*,
             p.key as project_key,
             p.name as project_name,
             u1.id as assignee_id,
             u1.first_name as assignee_first_name,
             u1.last_name as assignee_last_name,
             u1.avatar as assignee_avatar,
             u1.email as assignee_email,
             u2.first_name as reporter_first_name,
             u2.last_name as reporter_last_name,
             u2.avatar as reporter_avatar,
             u2.email as reporter_email
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      JOIN users u2 ON t.reporter_id = u2.id
      WHERE t.id = ?
    `).get(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.first_name, u.last_name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at DESC
    `).all(id);

    // Get activities
    const activities = db.prepare(`
      SELECT a.*, u.first_name, u.last_name
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at DESC
      LIMIT 20
    `).all(id);

    // Get attachments
    const attachments = db.prepare(`
      SELECT a.*, u.first_name, u.last_name
      FROM attachments a
      JOIN users u ON a.user_id = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at DESC
    `).all(id);

    // Get subtasks
    const subtasks = db.prepare(`
      SELECT t.*, p.key as project_key
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      WHERE t.parent_id = ?
    `).all(id).map(t => ({
      ...t,
      key: `${t.project_key}-${t.ticket_number}`
    }));

    res.json({
      success: true,
      data: {
        ticket: {
          ...ticket,
          key: `${ticket.project_key}-${ticket.ticket_number}`,
          comments,
          activities,
          attachments,
          subtasks
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket'
    });
  }
};

const updateTicket = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, status, priority, assigneeId, storyPoints, dueDate, labels } = req.body;

    // Get old ticket for activity logging
    const oldTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!oldTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    db.prepare(`
      UPDATE tickets
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          assignee_id = COALESCE(?, assignee_id),
          story_points = COALESCE(?, story_points),
          due_date = COALESCE(?, due_date),
          labels = COALESCE(?, labels),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, description, type, status, priority,
      assigneeId, storyPoints, dueDate,
      labels ? JSON.stringify(labels) : null, id
    );

    // Log changes
    const changes = [];
    if (status && status !== oldTicket.status) {
      changes.push({ field: 'status', from: oldTicket.status, to: status });
    }
    if (assigneeId && assigneeId !== oldTicket.assignee_id) {
      changes.push({ field: 'assignee', from: oldTicket.assignee_id, to: assigneeId });
    }
    if (priority && priority !== oldTicket.priority) {
      changes.push({ field: 'priority', from: oldTicket.priority, to: priority });
    }

    if (changes.length > 0) {
      db.prepare(`
        INSERT INTO activities (id, ticket_id, project_id, user_id, action, details)
        VALUES (?, ?, ?, ?, 'updated', ?)
      `).run(generateId(), id, oldTicket.project_id, req.userId, JSON.stringify({ changes }));
    }

    const ticket = db.prepare(`
      SELECT t.*,
             p.key as project_key,
             u1.first_name as assignee_first_name,
             u1.last_name as assignee_last_name,
             u1.avatar as assignee_avatar
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      WHERE t.id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket: { ...ticket, key: `${ticket.project_key}-${ticket.ticket_number}` } }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ticket'
    });
  }
};

const deleteTicket = (req, res) => {
  try {
    const { id } = req.params;

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    db.prepare('DELETE FROM tickets WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ticket'
    });
  }
};

const addComment = (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const commentId = generateId();
    db.prepare(`
      INSERT INTO comments (id, ticket_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(commentId, id, req.userId, content);

    const ticket = db.prepare('SELECT project_id FROM tickets WHERE id = ?').get(id);

    // Log activity
    db.prepare(`
      INSERT INTO activities (id, ticket_id, project_id, user_id, action, details)
      VALUES (?, ?, ?, ?, 'commented', ?)
    `).run(generateId(), id, ticket.project_id, req.userId, JSON.stringify({ commentId }));

    const comment = db.prepare(`
      SELECT c.*, u.first_name, u.last_name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

const updateComment = (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;

    db.prepare(`
      UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(content, commentId, req.userId);

    const comment = db.prepare(`
      SELECT c.*, u.first_name, u.last_name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating comment'
    });
  }
};

const deleteComment = (req, res) => {
  try {
    const { commentId } = req.params;

    db.prepare('DELETE FROM comments WHERE id = ? AND user_id = ?').run(commentId, req.userId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
};

const getKanbanBoard = (req, res) => {
  try {
    const { projectId } = req.params;

    // Get board columns
    const columns = db.prepare(`
      SELECT * FROM board_columns WHERE project_id = ? ORDER BY position
    `).all(projectId);

    // Get tickets grouped by status
    const tickets = db.prepare(`
      SELECT t.*,
             p.key as project_key,
             u1.first_name as assignee_first_name,
             u1.last_name as assignee_last_name,
             u1.avatar as assignee_avatar
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `).all(projectId).map(t => ({
      ...t,
      key: `${t.project_key}-${t.ticket_number}`
    }));

    // Group tickets by status
    const board = columns.map(col => ({
      ...col,
      tickets: tickets.filter(t => t.status === col.status_key)
    }));

    res.json({
      success: true,
      data: { board }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching kanban board'
    });
  }
};

const moveTicket = (req, res) => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    const oldTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

    db.prepare(`
      UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, id);

    // Log activity
    if (oldTicket.status !== status) {
      db.prepare(`
        INSERT INTO activities (id, ticket_id, project_id, user_id, action, details)
        VALUES (?, ?, ?, ?, 'moved', ?)
      `).run(generateId(), id, oldTicket.project_id, req.userId, JSON.stringify({
        from: oldTicket.status,
        to: status
      }));
    }

    res.json({
      success: true,
      message: 'Ticket moved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error moving ticket'
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  addComment,
  updateComment,
  deleteComment,
  getKanbanBoard,
  moveTicket
};
