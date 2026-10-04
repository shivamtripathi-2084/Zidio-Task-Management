import {
  useCallback,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { BACKEND_URI } from "../enviroment";
import { toast } from "react-toastify";

export type Task = {
  title: string;
  description: string;
  status: TaskStatus;
  isComplete:boolean
  dueDate?: string | null
  priority?: "low" | "medium" | "high"
  assignees?: {
    _id?: string
    name?: string
    email?: string
    role?: string
  }[]
  assignee?: {
    _id?: string
    name?: string
    email?: string
    role?: string
  } | null
  attachments?: TaskAttachment[]
  canManage?: boolean
  canDelete?: boolean
  canManageAttachments?: boolean
  _id:string
}

export type TaskStatus = "pending" | "in-progress" | "completed";

export type TaskAttachment = {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
};

export type TaskComment = {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    name?: string;
    email?: string;
  } | null;
};

export type TaskStats = {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  dueSoon: number;
  completionRate: number;
};

export type TaskNotification = {
  type: "overdue" | "upcoming";
  title: string;
  message: string;
  dueDate?: string | null;
};

interface TaskContextIf {
  addTask:(title:string,desc:string,dueDate?:string | null,priority?:"low" | "medium" | "high", assignees?: string[])=>Promise<void>
  updateTask:(id:string,updates:Partial<Pick<Task,"title" | "description" | "status" | "dueDate" | "priority">> & {assignees?: string[]})=>Promise<void>
  getAllTasks:()=>void
  getTaskStats:()=>void
  getTaskNotifications:()=>void
  tasks:Task[]
  taskStats: TaskStats
  notifications: TaskNotification[]
  deleteTaskById: (id: string) => void
  getTaskComments: (taskId: string) => Promise<TaskComment[]>
  addTaskComment: (taskId: string, text: string) => Promise<TaskComment[]>
  uploadTaskAttachments: (taskId: string, files: File[]) => Promise<TaskAttachment[]>
  downloadTaskAttachment: (taskId: string, attachmentId: string) => Promise<Blob>
  deleteTaskAttachment: (taskId: string, attachmentId: string) => Promise<void>
}

const AuthContext = createContext<TaskContextIf>({
  addTask: async () => {},
  updateTask: async () => {},
  getAllTasks: () => {},
  getTaskStats: () => {},
  getTaskNotifications: () => {},
  tasks: [],
  taskStats: { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, dueSoon: 0, completionRate: 0 },
  notifications: [],
  deleteTaskById: () => {},
  getTaskComments: async () => [],
  addTaskComment: async () => [],
  uploadTaskAttachments: async () => [],
  downloadTaskAttachment: async () => new Blob(),
  deleteTaskAttachment: async () => {},
});
export const useTask = () => {
  return useContext(AuthContext);
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    dueSoon: 0,
    completionRate: 0,
  });
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setTasks([]);
      setTaskStats({ total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, dueSoon: 0, completionRate: 0 });
      setNotifications([]);
      return;
    }

    getAllTasks();
    getTaskStats();
    getTaskNotifications();
  }, []);
  const addTask = async (title: string, desc: string, dueDate?: string | null, priority: "low" | "medium" | "high" = "medium", assignees: string[] = []) => {
    const response = await fetch(BACKEND_URI + "/task/add", {
      body: JSON.stringify({
        title,
        desc,
        dueDate: dueDate || null,
        priority,
        assignees,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to add task");
    }
    await getAllTasks();
    await getTaskStats();
    await getTaskNotifications();

    toast.success(data.msg);
  };

  const getAllTasks = async () => {
    const response = await fetch(BACKEND_URI + "/task/get-all", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load tasks");
    }
    setTasks(data.tasks);
  };

  const getTaskStats = async () => {
    const response = await fetch(BACKEND_URI + "/task/stats", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load task stats");
    }
    setTaskStats(data.stats);
  };

  const getTaskNotifications = async () => {
    const response = await fetch(BACKEND_URI + "/task/notifications", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load notifications");
    }
    setNotifications(data.notifications || []);
  };

  const deleteTaskById = async (id: string) => {
    const response = await fetch(BACKEND_URI + "/task/delete/" + id, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "DELETE",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to delete task");
    }

    await getAllTasks();
    await getTaskStats();
    await getTaskNotifications();

    toast.success(data.msg);
  };
  const updateTask = async (id: string, updates: Partial<Pick<Task,"title" | "description" | "status" | "dueDate" | "priority">> & {assignees?: string[]}) => {
    const response = await fetch(BACKEND_URI + "/task/edit/" + id, {
      body: JSON.stringify(updates),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "PUT",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to update task");
    }

    await getAllTasks();
    await getTaskStats();
    await getTaskNotifications();

    toast.success(data.msg);
  };

  const getTaskComments = useCallback(async (taskId: string): Promise<TaskComment[]> => {
    const response = await fetch(`${BACKEND_URI}/task/${taskId}/comments`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "GET",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load task comments");
    }

    return data.comments;
  }, []);

  const addTaskComment = useCallback(async (taskId: string, text: string): Promise<TaskComment[]> => {
    const response = await fetch(`${BACKEND_URI}/task/${taskId}/comments`, {
      body: JSON.stringify({ text }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to add comment");
    }

    toast.success(data.msg);
    return data.comments;
  }, []);

  const uploadTaskAttachments = useCallback(async (taskId: string, files: File[]): Promise<TaskAttachment[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await fetch(`${BACKEND_URI}/task/${taskId}/attachments`, {
      body: formData,
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to upload attachments");
    }

    toast.success(data.msg);
    return data.attachments;
  }, []);

  const downloadTaskAttachment = useCallback(async (taskId: string, attachmentId: string): Promise<Blob> => {
    const response = await fetch(`${BACKEND_URI}/task/${taskId}/attachments/${attachmentId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Unable to download attachment");
    }

    return response.blob();
  }, []);

  const deleteTaskAttachment = useCallback(async (taskId: string, attachmentId: string): Promise<void> => {
    const response = await fetch(`${BACKEND_URI}/task/${taskId}/attachments/${attachmentId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to delete attachment");
    }

    toast.success(data.msg);
  }, []);

  return (
    <AuthContext.Provider
      value={{ addTask, updateTask, getAllTasks, getTaskStats, getTaskNotifications, tasks, taskStats, notifications, deleteTaskById, getTaskComments, addTaskComment, uploadTaskAttachments, downloadTaskAttachment, deleteTaskAttachment }}
    >
      {children}
    </AuthContext.Provider>
  );
};
