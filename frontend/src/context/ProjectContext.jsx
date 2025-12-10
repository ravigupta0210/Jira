import { createContext, useContext, useState, useCallback } from 'react';
import { projectsAPI, ticketsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [kanbanBoard, setKanbanBoard] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      setProjects(response.data.data.projects);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProject = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await projectsAPI.getOne(id);
      setCurrentProject(response.data.data.project);
      return response.data.data.project;
    } catch (error) {
      toast.error('Failed to fetch project');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (data) => {
    try {
      const response = await projectsAPI.create(data);
      const newProject = response.data.data.project;
      setProjects((prev) => [newProject, ...prev]);
      toast.success('Project created successfully');
      return { success: true, project: newProject };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateProject = async (id, data) => {
    try {
      const response = await projectsAPI.update(id, data);
      const updated = response.data.data.project;
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      if (currentProject?.id === id) {
        setCurrentProject((prev) => ({ ...prev, ...updated }));
      }
      toast.success('Project updated');
      return { success: true };
    } catch (error) {
      toast.error('Failed to update project');
      return { success: false };
    }
  };

  const deleteProject = async (id) => {
    try {
      await projectsAPI.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      toast.success('Project deleted');
      return { success: true };
    } catch (error) {
      toast.error('Failed to delete project');
      return { success: false };
    }
  };

  const fetchTickets = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getAll(params);
      setTickets(response.data.data.tickets);
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch tickets');
      return { tickets: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKanbanBoard = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getKanban(projectId);
      setKanbanBoard(response.data.data.board);
      return response.data.data.board;
    } catch (error) {
      toast.error('Failed to fetch kanban board');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = async (data) => {
    try {
      const response = await ticketsAPI.create(data);
      const newTicket = response.data.data.ticket;
      setTickets((prev) => [newTicket, ...prev]);
      toast.success('Ticket created');
      return { success: true, ticket: newTicket };
    } catch (error) {
      toast.error('Failed to create ticket');
      return { success: false };
    }
  };

  const updateTicket = async (id, data) => {
    try {
      const response = await ticketsAPI.update(id, data);
      const updated = response.data.data.ticket;
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
      );
      toast.success('Ticket updated');
      return { success: true, ticket: updated };
    } catch (error) {
      toast.error('Failed to update ticket');
      return { success: false };
    }
  };

  const deleteTicket = async (id) => {
    try {
      await ticketsAPI.delete(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success('Ticket deleted');
      return { success: true };
    } catch (error) {
      toast.error('Failed to delete ticket');
      return { success: false };
    }
  };

  const moveTicket = async (id, status) => {
    try {
      await ticketsAPI.move(id, { status });
      return { success: true };
    } catch (error) {
      toast.error('Failed to move ticket');
      return { success: false };
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        tickets,
        kanbanBoard,
        loading,
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        fetchTickets,
        fetchKanbanBoard,
        createTicket,
        updateTicket,
        deleteTicket,
        moveTicket,
        setTickets,
        setKanbanBoard,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
