const db = require('../config/database');
const { generateId, generateMeetingLink } = require('../utils/helpers');

const createMeeting = (req, res) => {
  try {
    const { title, description, projectId, startTime, endTime, location, type, recurring, participants } = req.body;

    const meetingId = generateId();
    const meetingLink = generateMeetingLink();

    db.prepare(`
      INSERT INTO meetings (id, title, description, organizer_id, project_id, meeting_link, start_time, end_time, location, type, recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      meetingId, title, description || '', req.userId,
      projectId || null, meetingLink, startTime, endTime,
      location || null, type || 'general', recurring || null
    );

    // Add organizer as participant
    db.prepare(`
      INSERT INTO meeting_participants (id, meeting_id, user_id, status)
      VALUES (?, ?, ?, 'accepted')
    `).run(generateId(), meetingId, req.userId);

    // Add other participants
    if (participants && participants.length > 0) {
      const insertParticipant = db.prepare(`
        INSERT INTO meeting_participants (id, meeting_id, user_id, status)
        VALUES (?, ?, ?, 'pending')
      `);

      for (const userId of participants) {
        if (userId !== req.userId) {
          insertParticipant.run(generateId(), meetingId, userId);

          // Create notification
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, reference_id, reference_type)
            VALUES (?, ?, 'meeting_invite', ?, ?, ?, 'meeting')
          `).run(generateId(), userId, 'Meeting Invitation', `You've been invited to "${title}"`, meetingId);
        }
      }
    }

    const meeting = getMeetingWithDetails(meetingId);

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully',
      data: { meeting }
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating meeting'
    });
  }
};

const getMeetingWithDetails = (meetingId) => {
  const meeting = db.prepare(`
    SELECT m.*,
           u.first_name as organizer_first_name,
           u.last_name as organizer_last_name,
           u.avatar as organizer_avatar,
           p.name as project_name
    FROM meetings m
    JOIN users u ON m.organizer_id = u.id
    LEFT JOIN projects p ON m.project_id = p.id
    WHERE m.id = ?
  `).get(meetingId);

  if (!meeting) return null;

  const participants = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.avatar, u.email, mp.status
    FROM meeting_participants mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.meeting_id = ?
  `).all(meetingId);

  return { ...meeting, participants };
};

const getMeetings = (req, res) => {
  try {
    const { startDate, endDate, projectId, status } = req.query;

    let query = `
      SELECT DISTINCT m.*,
             u.first_name as organizer_first_name,
             u.last_name as organizer_last_name,
             p.name as project_name
      FROM meetings m
      JOIN users u ON m.organizer_id = u.id
      LEFT JOIN projects p ON m.project_id = p.id
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE (m.organizer_id = ? OR mp.user_id = ?)
    `;

    const params = [req.userId, req.userId];

    if (startDate) {
      query += ' AND m.start_time >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND m.end_time <= ?';
      params.push(endDate);
    }

    if (projectId) {
      query += ' AND m.project_id = ?';
      params.push(projectId);
    }

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    query += ' ORDER BY m.start_time ASC';

    const meetings = db.prepare(query).all(...params);

    // Get participants for each meeting
    const meetingsWithParticipants = meetings.map(meeting => {
      const participants = db.prepare(`
        SELECT u.id, u.first_name, u.last_name, u.avatar, mp.status
        FROM meeting_participants mp
        JOIN users u ON mp.user_id = u.id
        WHERE mp.meeting_id = ?
      `).all(meeting.id);
      return { ...meeting, participants };
    });

    res.json({
      success: true,
      data: { meetings: meetingsWithParticipants }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meetings'
    });
  }
};

const getMeeting = (req, res) => {
  try {
    const { id } = req.params;
    const meeting = getMeetingWithDetails(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      data: { meeting }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meeting'
    });
  }
};

const updateMeeting = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime, location, status } = req.body;

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.organizer_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only organizer can update the meeting'
      });
    }

    db.prepare(`
      UPDATE meetings
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          location = COALESCE(?, location),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, startTime, endTime, location, status, id);

    // Notify participants of changes
    const participants = db.prepare(`
      SELECT user_id FROM meeting_participants WHERE meeting_id = ? AND user_id != ?
    `).all(id, req.userId);

    for (const p of participants) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, reference_type)
        VALUES (?, ?, 'meeting_updated', ?, ?, ?, 'meeting')
      `).run(generateId(), p.user_id, 'Meeting Updated', `Meeting "${meeting.title}" has been updated`, id);
    }

    const updatedMeeting = getMeetingWithDetails(id);

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: { meeting: updatedMeeting }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating meeting'
    });
  }
};

const deleteMeeting = (req, res) => {
  try {
    const { id } = req.params;

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.organizer_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only organizer can delete the meeting'
      });
    }

    // Notify participants
    const participants = db.prepare(`
      SELECT user_id FROM meeting_participants WHERE meeting_id = ? AND user_id != ?
    `).all(id, req.userId);

    for (const p of participants) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, reference_type)
        VALUES (?, ?, 'meeting_cancelled', ?, ?, ?, 'meeting')
      `).run(generateId(), p.user_id, 'Meeting Cancelled', `Meeting "${meeting.title}" has been cancelled`, id);
    }

    db.prepare('DELETE FROM meetings WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting meeting'
    });
  }
};

const respondToMeeting = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted', 'declined', 'tentative'

    db.prepare(`
      UPDATE meeting_participants
      SET status = ?
      WHERE meeting_id = ? AND user_id = ?
    `).run(status, id, req.userId);

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    const user = db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(req.userId);

    // Notify organizer
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, reference_id, reference_type)
      VALUES (?, ?, 'meeting_response', ?, ?, ?, 'meeting')
    `).run(
      generateId(), meeting.organizer_id, 'Meeting Response',
      `${user.first_name} ${user.last_name} ${status} your meeting invitation`, id
    );

    res.json({
      success: true,
      message: `Meeting invitation ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error responding to meeting'
    });
  }
};

const addParticipants = (req, res) => {
  try {
    const { id } = req.params;
    const { participants } = req.body;

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    const insertParticipant = db.prepare(`
      INSERT OR IGNORE INTO meeting_participants (id, meeting_id, user_id, status)
      VALUES (?, ?, ?, 'pending')
    `);

    for (const userId of participants) {
      insertParticipant.run(generateId(), id, userId);

      // Create notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, reference_id, reference_type)
        VALUES (?, ?, 'meeting_invite', ?, ?, ?, 'meeting')
      `).run(generateId(), userId, 'Meeting Invitation', `You've been invited to "${meeting.title}"`, id);
    }

    const updatedMeeting = getMeetingWithDetails(id);

    res.json({
      success: true,
      message: 'Participants added successfully',
      data: { meeting: updatedMeeting }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding participants'
    });
  }
};

const getUpcomingMeetings = (req, res) => {
  try {
    const now = new Date().toISOString();

    const meetings = db.prepare(`
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
      LIMIT 10
    `).all(req.userId, req.userId, now);

    res.json({
      success: true,
      data: { meetings }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming meetings'
    });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  respondToMeeting,
  addParticipants,
  getUpcomingMeetings
};
