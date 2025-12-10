import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiCalendar,
  HiClock,
  HiUserGroup,
  HiVideoCamera,
  HiLocationMarker,
  HiCheck,
  HiX,
} from 'react-icons/hi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { meetingsAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Modal,
  Input,
  Spinner,
  Avatar,
  AvatarGroup,
  Badge,
  EmptyState,
} from '../components/common';
import { formatDate, formatTime, getMeetingTimeLabel } from '../utils/helpers';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const MeetingCard = ({ meeting, onView, onRespond, userId }) => {
  const isOrganizer = meeting.organizer_id === userId;
  const myStatus = meeting.participants?.find((p) => p.id === userId)?.status;

  return (
    <div
      className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(meeting)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
              {getMeetingTimeLabel(meeting.start_time)}
            </span>
            {isOrganizer && <Badge variant="primary">Organizer</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{meeting.title}</h3>
        </div>
        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
          <HiVideoCamera className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
      </div>

      {meeting.description && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {meeting.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <HiClock className="h-4 w-4" />
          {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
        </div>
        {meeting.project_name && (
          <div className="flex items-center gap-1">
            <HiLocationMarker className="h-4 w-4" />
            {meeting.project_name}
          </div>
        )}
      </div>

      {/* Google Meet Link */}
      {meeting.meeting_link && (
        <div className="mb-4">
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            <HiVideoCamera className="h-4 w-4" />
            Join Google Meet
          </a>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-2">
          <AvatarGroup users={meeting.participants || []} max={4} size="xs" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {meeting.participants?.length || 0} participants
          </span>
        </div>

        {!isOrganizer && myStatus === 'pending' && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onRespond(meeting.id, 'accepted')}
              className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50"
            >
              <HiCheck className="h-4 w-4" />
            </button>
            <button
              onClick={() => onRespond(meeting.id, 'declined')}
              className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              <HiX className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MeetingForm = ({ onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    participants: [],
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getUsers();
        setUsers(response.data.data.users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleParticipantToggle = (userId) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }
    onSubmit({
      ...formData,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <Input
        label="Meeting title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="What is the meeting about?"
        autoFocus
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
          placeholder="Add meeting details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Start time
          </label>
          <DatePicker
            selected={formData.startTime}
            onChange={(date) => setFormData((prev) => ({ ...prev, startTime: date }))}
            showTimeSelect
            dateFormat="MMM d, yyyy h:mm aa"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            End time
          </label>
          <DatePicker
            selected={formData.endTime}
            onChange={(date) => setFormData((prev) => ({ ...prev, endTime: date }))}
            showTimeSelect
            dateFormat="MMM d, yyyy h:mm aa"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invite participants
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
          {users.map((user) => (
            <label
              key={user.id}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.participants.includes(user.id)}
                onChange={() => handleParticipantToggle(user.id)}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <Avatar user={user} size="xs" />
              <span className="text-sm text-gray-900">
                {user.first_name} {user.last_name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Schedule Meeting
        </Button>
      </div>
    </form>
  );
};

export const Meetings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('upcoming');

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'upcoming') {
        params.startDate = new Date().toISOString();
      }
      const response = await meetingsAPI.getAll(params);
      setMeetings(response.data.data.meetings);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const handleCreateMeeting = async (data) => {
    setSubmitting(true);
    try {
      await meetingsAPI.create(data);
      toast.success('Meeting scheduled successfully');
      setShowModal(false);
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to schedule meeting');
    }
    setSubmitting(false);
  };

  const handleRespond = async (meetingId, status) => {
    try {
      await meetingsAPI.respond(meetingId, status);
      toast.success(`Meeting invitation ${status}`);
      fetchMeetings();
    } catch (error) {
      toast.error('Failed to respond to meeting');
    }
  };

  const handleViewMeeting = (meeting) => {
    // Could open a detail modal or navigate to meeting detail page
    console.log('View meeting:', meeting);
  };

  if (loading && meetings.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meetings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule and manage your meetings</p>
        </div>
        <Button icon={HiPlus} onClick={() => setShowModal(true)}>
          Schedule Meeting
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setFilter('upcoming')}
            className={clsx(
              'px-4 py-2 rounded-lg transition-colors',
              filter === 'upcoming' ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('all')}
            className={clsx(
              'px-4 py-2 rounded-lg transition-colors',
              filter === 'all' ? 'bg-white dark:bg-dark-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            All Meetings
          </button>
        </div>
      </div>

      {/* Meetings Grid */}
      {meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              userId={user?.id}
              onView={handleViewMeeting}
              onRespond={handleRespond}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={HiCalendar}
          title="No meetings scheduled"
          description="Schedule a meeting to collaborate with your team."
          action={() => setShowModal(true)}
          actionLabel="Schedule Meeting"
        />
      )}

      {/* Create Meeting Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Meeting"
      >
        <MeetingForm
          onSubmit={handleCreateMeeting}
          onClose={() => setShowModal(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
};

export default Meetings;
