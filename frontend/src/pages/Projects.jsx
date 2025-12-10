import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiDotsVertical,
  HiPencil,
  HiTrash,
  HiCollection,
  HiViewGrid,
  HiViewList,
} from 'react-icons/hi';
import { useProject } from '../context/ProjectContext';
import {
  Button,
  Modal,
  Input,
  Spinner,
  EmptyState,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  AvatarGroup,
} from '../components/common';
import { clsx } from 'clsx';

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-6 hover:shadow-md hover:border-gray-200 dark:hover:border-dark-600 transition-all cursor-pointer group"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
          style={{ backgroundColor: project.color || '#6366f1' }}
        >
          {project.key?.charAt(0)}
        </div>
        <Dropdown
          align="right"
          trigger={
            <button
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <HiDotsVertical className="h-5 w-5" />
            </button>
          }
        >
          {({ close }) => (
            <>
              <DropdownItem
                icon={HiPencil}
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  onEdit(project);
                }}
              >
                Edit
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={HiTrash}
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  onDelete(project);
                }}
              >
                Delete
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{project.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
        {project.description || 'No description'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded">
            {project.key}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {project.ticket_count || 0} tickets
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {project.member_count || 1} members
        </span>
      </div>
    </div>
  );
};

const ProjectForm = ({ project, onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    key: project?.key || '',
    description: project?.description || '',
    color: project?.color || '#6366f1',
  });
  const [errors, setErrors] = useState({});

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate key from name
    if (name === 'name' && !project) {
      const key = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);
      setFormData((prev) => ({ ...prev, key }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.key.trim()) newErrors.key = 'Project key is required';
    if (formData.key.length < 2) newErrors.key = 'Key must be at least 2 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        label="Project name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter project name"
        error={errors.name}
      />

      <Input
        label="Project key"
        name="key"
        value={formData.key}
        onChange={handleChange}
        placeholder="e.g., PROJ"
        disabled={!!project}
        error={errors.key}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Describe your project..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project color
        </label>
        <div className="flex gap-2 flex-wrap">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, color }))}
              className={clsx(
                'w-8 h-8 rounded-lg transition-transform',
                formData.color === color && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export const Projects = () => {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects, createProject, updateProject, deleteProject } = useProject();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    if (editingProject) {
      await updateProject(editingProject.id, data);
    } else {
      const result = await createProject(data);
      if (result.success) {
        navigate(`/projects/${result.project.id}`);
      }
    }
    setSubmitting(false);
    setShowModal(false);
    setEditingProject(null);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDelete = async (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      await deleteProject(project.id);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and organize your projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <HiViewGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <HiViewList className="h-5 w-5" />
            </button>
          </div>
          <Button icon={HiPlus} onClick={() => setShowModal(true)}>
            New Project
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {projects.length > 0 ? (
        <div
          className={clsx(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={HiCollection}
          title="No projects yet"
          description="Create your first project to start organizing your work."
          action={() => setShowModal(true)}
          actionLabel="Create Project"
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProject(null);
        }}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <ProjectForm
          project={editingProject}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          loading={submitting}
        />
      </Modal>
    </div>
  );
};

export default Projects;
