const db = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('Seeding database...');

// Create demo users
const password = bcrypt.hashSync('password123', 10);

const users = [
  {
    id: uuidv4(),
    email: 'admin@projectflow.com',
    password,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin'
  },
  {
    id: uuidv4(),
    email: 'john@projectflow.com',
    password,
    first_name: 'John',
    last_name: 'Doe',
    role: 'member'
  },
  {
    id: uuidv4(),
    email: 'jane@projectflow.com',
    password,
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'member'
  }
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, email, password, first_name, last_name, role)
  VALUES (@id, @email, @password, @first_name, @last_name, @role)
`);

for (const user of users) {
  insertUser.run(user);
}

console.log('Created demo users:');
console.log('  - admin@projectflow.com / password123');
console.log('  - john@projectflow.com / password123');
console.log('  - jane@projectflow.com / password123');

// Create a demo project
const projectId = uuidv4();
const project = {
  id: projectId,
  name: 'Demo Project',
  key: 'DEMO',
  description: 'A demo project to showcase ProjectFlow features',
  owner_id: users[0].id,
  color: '#6366f1'
};

const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (id, name, key, description, owner_id, color)
  VALUES (@id, @name, @key, @description, @owner_id, @color)
`);

insertProject.run(project);

// Add members to project
const insertMember = db.prepare(`
  INSERT OR IGNORE INTO project_members (id, project_id, user_id, role)
  VALUES (@id, @project_id, @user_id, @role)
`);

for (const user of users) {
  insertMember.run({
    id: uuidv4(),
    project_id: projectId,
    user_id: user.id,
    role: user.role === 'admin' ? 'owner' : 'member'
  });
}

// Initialize ticket sequence
db.prepare(`
  INSERT OR IGNORE INTO ticket_sequences (project_id, last_number)
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
  INSERT OR IGNORE INTO board_columns (id, project_id, name, status_key, position, color)
  VALUES (@id, @project_id, @name, @status_key, @position, @color)
`);

for (const col of columns) {
  insertColumn.run({
    id: uuidv4(),
    project_id: projectId,
    ...col
  });
}

// Create some sample tickets
const ticketTypes = ['task', 'bug', 'story', 'epic'];
const priorities = ['low', 'medium', 'high', 'critical'];
const statuses = ['todo', 'in_progress', 'in_review', 'done'];

const sampleTickets = [
  {
    title: 'Set up project infrastructure',
    description: 'Configure the initial project setup including database, authentication, and API structure.',
    type: 'task',
    status: 'done',
    priority: 'high'
  },
  {
    title: 'Design user dashboard',
    description: 'Create a comprehensive dashboard design that shows all relevant information at a glance.',
    type: 'story',
    status: 'in_progress',
    priority: 'high'
  },
  {
    title: 'Fix login redirect issue',
    description: 'Users are not being redirected properly after login. Need to fix the authentication flow.',
    type: 'bug',
    status: 'todo',
    priority: 'critical'
  },
  {
    title: 'Implement drag and drop for Kanban',
    description: 'Add drag and drop functionality to the Kanban board for easy ticket management.',
    type: 'task',
    status: 'in_review',
    priority: 'medium'
  },
  {
    title: 'User Management Epic',
    description: 'Epic for all user management related features including profile, settings, and permissions.',
    type: 'epic',
    status: 'in_progress',
    priority: 'high'
  }
];

const insertTicket = db.prepare(`
  INSERT INTO tickets (id, ticket_number, project_id, title, description, type, status, priority, reporter_id, assignee_id)
  VALUES (@id, @ticket_number, @project_id, @title, @description, @type, @status, @priority, @reporter_id, @assignee_id)
`);

const updateSequence = db.prepare(`
  UPDATE ticket_sequences SET last_number = last_number + 1 WHERE project_id = ?
`);

const getSequence = db.prepare(`
  SELECT last_number FROM ticket_sequences WHERE project_id = ?
`);

for (const ticket of sampleTickets) {
  updateSequence.run(projectId);
  const { last_number } = getSequence.get(projectId);

  insertTicket.run({
    id: uuidv4(),
    ticket_number: last_number,
    project_id: projectId,
    title: ticket.title,
    description: ticket.description,
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    reporter_id: users[0].id,
    assignee_id: users[Math.floor(Math.random() * users.length)].id
  });
}

console.log('Created demo project with sample tickets');
console.log('Seeding completed successfully!');
