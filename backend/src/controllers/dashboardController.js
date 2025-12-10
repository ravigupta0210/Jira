const db = require('../config/database');

const getDashboard = (req, res) => {
  try {
    const now = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get user's projects
    const projects = db.prepare(`
      SELECT p.*,
             (SELECT COUNT(*) FROM tickets WHERE project_id = p.id) as ticket_count,
             (SELECT COUNT(*) FROM tickets WHERE project_id = p.id AND status != 'done') as open_tickets
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
      ORDER BY p.updated_at DESC
      LIMIT 5
    `).all(req.userId);

    // Get assigned tickets
    const assignedTickets = db.prepare(`
      SELECT t.*, p.key as project_key, p.name as project_name
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? AND t.status != 'done'
      ORDER BY
        CASE t.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT 10
    `).all(req.userId).map(t => ({
      ...t,
      key: `${t.project_key}-${t.ticket_number}`
    }));

    // Get upcoming meetings (next 7 days)
    const upcomingMeetings = db.prepare(`
      SELECT m.*,
             u.first_name as organizer_first_name,
             u.last_name as organizer_last_name,
             p.name as project_name
      FROM meetings m
      JOIN users u ON m.organizer_id = u.id
      LEFT JOIN projects p ON m.project_id = p.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE (m.organizer_id = ? OR mp.user_id = ?)
        AND m.start_time >= ?
        AND m.status = 'scheduled'
      ORDER BY m.start_time ASC
      LIMIT 5
    `).all(req.userId, req.userId, now);

    // Get recent activity
    const recentActivity = db.prepare(`
      SELECT a.*,
             u.first_name, u.last_name,
             t.title as ticket_title,
             p.key as project_key,
             t.ticket_number
      FROM activities a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN tickets t ON a.ticket_id = t.id
      LEFT JOIN projects p ON a.project_id = p.id
      WHERE a.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      )
      ORDER BY a.created_at DESC
      LIMIT 15
    `).all(req.userId);

    // Get unread notifications count
    const { unread } = db.prepare(`
      SELECT COUNT(*) as unread FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.userId);

    // Get ticket stats
    const ticketStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN assignee_id = ? AND status != 'done' THEN 1 ELSE 0 END) as my_open_tickets,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as created_this_week,
        SUM(CASE WHEN status = 'done' AND updated_at >= ? THEN 1 ELSE 0 END) as completed_this_week
      FROM tickets t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ?
    `).get(req.userId, weekAgo, weekAgo, req.userId);

    // Get overdue tickets
    const overdueTickets = db.prepare(`
      SELECT t.*, p.key as project_key
      FROM tickets t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ?
        AND t.due_date < ?
        AND t.status != 'done'
      ORDER BY t.due_date ASC
      LIMIT 5
    `).all(req.userId, now).map(t => ({
      ...t,
      key: `${t.project_key}-${t.ticket_number}`
    }));

    res.json({
      success: true,
      data: {
        projects,
        assignedTickets,
        upcomingMeetings,
        recentActivity,
        unreadNotifications: unread,
        ticketStats,
        overdueTickets
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

const getActivityFeed = (req, res) => {
  try {
    const { page = 1, limit = 20, projectId } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*,
             u.first_name, u.last_name, u.avatar,
             t.title as ticket_title,
             p.key as project_key,
             p.name as project_name,
             t.ticket_number
      FROM activities a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN tickets t ON a.ticket_id = t.id
      LEFT JOIN projects p ON a.project_id = p.id
      WHERE a.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = ?
      )
    `;

    const params = [req.userId];

    if (projectId) {
      query += ' AND a.project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const activities = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activity feed'
    });
  }
};

module.exports = {
  getDashboard,
  getActivityFeed
};
