import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import './App.css'

type ColumnId = 'backlog' | 'in-progress' | 'review' | 'done'
type Priority = 'urgent' | 'high' | 'normal' | 'low'

type Task = {
  id: string
  title: string
  description: string
  status: ColumnId
  priority: Priority
  tags: string[]
  dueDate: string
  owner: string
}

const STORAGE_KEY = 'waypoint-board-v1'
const CURRENT_USER = 'Jamie Chen'

const columns: { id: ColumnId; title: string; icon: typeof Circle }[] = [
  { id: 'backlog', title: 'Up next', icon: CircleDashed },
  { id: 'in-progress', title: 'In progress', icon: CircleDot },
  { id: 'review', title: 'In review', icon: Circle },
  { id: 'done', title: 'Complete', icon: CircleCheck },
]

const owners = ['Jamie Chen', 'Alex Rivera', 'Morgan Lee', 'Taylor Kim', 'Sam Patel']

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Confirm launch positioning',
    description: 'Align the one-line promise with the customer interviews.',
    status: 'backlog',
    priority: 'high',
    tags: ['Research', 'Messaging'],
    dueDate: '2026-10-12',
    owner: 'Jamie Chen',
  },
  {
    id: 'task-2',
    title: 'Audit welcome emails',
    description: 'Check the first-week sequence for gaps and stale links.',
    status: 'backlog',
    priority: 'normal',
    tags: ['Content'],
    dueDate: '2026-10-16',
    owner: 'Alex Rivera',
  },
  {
    id: 'task-3',
    title: 'Map activation events',
    description: 'Define the events we need before the launch dashboard ships.',
    status: 'in-progress',
    priority: 'urgent',
    tags: ['Analytics', 'Engineering'],
    dueDate: '2026-10-09',
    owner: 'Morgan Lee',
  },
  {
    id: 'task-4',
    title: 'Build billing state components',
    description: '',
    status: 'in-progress',
    priority: 'high',
    tags: ['Product', 'UI'],
    dueDate: '2026-10-14',
    owner: 'Taylor Kim',
  },
  {
    id: 'task-5',
    title: 'Homepage art direction',
    description: 'Bring the new editorial direction into the responsive layouts.',
    status: 'in-progress',
    priority: 'normal',
    tags: ['Design'],
    dueDate: '2026-10-19',
    owner: 'Sam Patel',
  },
  {
    id: 'task-6',
    title: 'Review empty states',
    description: 'Final pass on copy, spacing, and the first-use experience.',
    status: 'review',
    priority: 'high',
    tags: ['Design', 'Product'],
    dueDate: '2026-10-08',
    owner: 'Jamie Chen',
  },
  {
    id: 'task-7',
    title: 'Instrument invite funnel',
    description: '',
    status: 'review',
    priority: 'low',
    tags: ['Analytics'],
    dueDate: '2026-10-22',
    owner: 'Alex Rivera',
  },
  {
    id: 'task-8',
    title: 'Write release checklist',
    description: 'A short handoff for support, sales, and the launch crew.',
    status: 'done',
    priority: 'low',
    tags: ['Operations'],
    dueDate: '2026-10-07',
    owner: 'Morgan Lee',
  },
]

const priorityLabels: Record<Priority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
}

function loadTasks(): Task[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialTasks
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as Task[]) : initialTasks
  } catch {
    return initialTasks
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

function formatDate(value: string) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T00:00:00`),
  )
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [dialog, setDialog] = useState<{ task?: Task; status: ColumnId } | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target
      const isTyping = target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const visibleTasks = tasks.filter((task) => {
    const matchesQuery =
      !normalizedQuery ||
      [task.title, task.description, task.owner, ...task.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesOwner = !myTasksOnly || task.owner === CURRENT_USER
    return matchesQuery && matchesPriority && matchesOwner
  })

  function saveTask(updatedTask: Task) {
    setTasks((current) => {
      const exists = current.some((task) => task.id === updatedTask.id)
      return exists
        ? current.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        : [...current, { ...updatedTask, id: crypto.randomUUID() }]
    })
    setDialog(null)
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id))
    setOpenMenuId(null)
  }

  function moveTask(id: string, status: ColumnId) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)))
    setDraggedId(null)
  }

  function openCreate(status: ColumnId = 'backlog') {
    setDialog({ status })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#board" aria-label="Waypoint home">
          <span className="brand-mark"><span /></span>
          <span>waypoint</span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-avatar">S</span>
          <span className="workspace-copy"><strong>Studio North</strong><small>Free workspace</small></span>
        </div>

        <p className="nav-label">Workspace</p>
        <nav className="primary-nav" aria-label="Workspace navigation">
          <a className="nav-item active" href="#board" aria-current="page">
            <LayoutDashboard size={17} /> <span>Board</span>
          </a>
          <button
            className={`nav-item ${myTasksOnly ? 'active' : ''}`}
            type="button"
            onClick={() => setMyTasksOnly((current) => !current)}
            aria-pressed={myTasksOnly}
          >
            <ListTodo size={17} /> <span>My tasks</span>
            <span className="nav-count">{tasks.filter((task) => task.owner === CURRENT_USER).length}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={16} />
            <span><strong>Small steps,</strong><br />shipped often.</span>
          </div>
          <div className="profile-button" title="Signed in as Jamie Chen">
            <span className="avatar avatar-jamie">JC</span>
            <span className="profile-copy"><strong>Jamie Chen</strong><small>Product lead</small></span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="board">
        <header className="topbar">
          <div className="breadcrumbs"><span>Studio North</span><span className="crumb-divider">/</span><strong>Product launch</strong></div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                ref={searchInputRef}
                aria-label="Search tasks"
                placeholder="Search tasks..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>/</kbd>
            </label>
            <span className="avatar avatar-alex" title="Alex Rivera">AR</span>
            <span className="avatar avatar-morgan" title="Morgan Lee">ML</span>
            <span className="avatar avatar-taylor" title="Taylor Kim">TK</span>
            <span className="avatar avatar-overflow" title="Two more teammates">+2</span>
          </div>
        </header>

        <section className="board-content" aria-labelledby="board-title">
          <div className="board-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> TEAM BOARD <span className="eyebrow-divider">/</span> Q4 LAUNCH</div>
              <h1 id="board-title">Product launch</h1>
              <p className="board-subtitle">A clear path from first idea to shipped work.</p>
            </div>
            <button className="button button-primary" type="button" onClick={() => openCreate()}>
              <Plus size={17} strokeWidth={2.5} /> New task
            </button>
          </div>

          <div className="board-toolbar">
            <div className="board-summary">
              <span className="summary-count">{visibleTasks.length} tasks</span>
              <span className="summary-divider" />
              <button
                className={`filter-chip ${myTasksOnly ? 'selected' : ''}`}
                type="button"
                onClick={() => setMyTasksOnly((current) => !current)}
                aria-pressed={myTasksOnly}
              >
                <UserRound size={14} /> Assigned to me
              </button>
            </div>
            <div className="toolbar-controls">
              <label className="select-control">
                <SlidersHorizontal size={15} />
                <select
                  aria-label="Filter by priority"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as Priority | 'all')}
                >
                  <option value="all">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown size={14} />
              </label>
              <span className="updated-note"><span /> All changes saved</span>
            </div>
          </div>

          <div className="board-scroll" aria-label="Kanban board">
            <div className="board-columns">
              {columns.map((column) => {
                const columnTasks = visibleTasks.filter((task) => task.status === column.id)
                const ColumnIcon = column.icon
                return (
                  <section
                    className={`board-column column-${column.id} ${draggedId ? 'is-drop-target' : ''}`}
                    key={column.id}
                    aria-labelledby={`column-${column.id}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (draggedId) moveTask(draggedId, column.id)
                    }}
                  >
                    <header className="column-header">
                      <div className="column-title-wrap">
                        <ColumnIcon className="column-icon" size={16} strokeWidth={2} />
                        <h2 id={`column-${column.id}`}>{column.title}</h2>
                        <span className="column-count">{columnTasks.length}</span>
                      </div>
                      <button
                        className="icon-button column-add"
                        type="button"
                        title={`Add a task to ${column.title}`}
                        aria-label={`Add a task to ${column.title}`}
                        onClick={() => openCreate(column.id)}
                      >
                        <Plus size={17} />
                      </button>
                    </header>

                    <div className="task-list">
                      {columnTasks.map((task, index) => (
                        <article
                          className={`task-card ${draggedId === task.id ? 'is-dragging' : ''}`}
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggedId(task.id)}
                          onDragEnd={() => setDraggedId(null)}
                          style={{ animationDelay: `${index * 35}ms` }}
                        >
                          <div className="task-topline">
                            <span className={`priority-label priority-${task.priority}`}>
                              {task.priority === 'urgent' && <ArrowUp size={12} />}
                              {task.priority === 'high' && <ArrowUp size={12} />}
                              {task.priority === 'low' && <ArrowDown size={12} />}
                              {task.priority === 'normal' && <span className="priority-dash" />}
                              {priorityLabels[task.priority]}
                            </span>
                            <div className="task-menu-wrap">
                              <button
                                className="icon-button task-menu-trigger"
                                type="button"
                                title="Task actions"
                                aria-label={`Actions for ${task.title}`}
                                aria-expanded={openMenuId === task.id}
                                onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                              >
                                <MoreHorizontal size={17} />
                              </button>
                              {openMenuId === task.id && (
                                <div className="task-menu" role="menu">
                                  <button type="button" role="menuitem" onClick={() => { setDialog({ task, status: task.status }); setOpenMenuId(null) }}>
                                    Edit task
                                  </button>
                                  <button
                                    className="delete-action"
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      if (window.confirm(`Delete “${task.title}”?`)) deleteTask(task.id)
                                      else setOpenMenuId(null)
                                    }}
                                  >
                                    <Trash2 size={14} /> Delete task
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            className="task-open"
                            type="button"
                            onClick={() => setDialog({ task, status: task.status })}
                          >
                            <h3>{task.title}</h3>
                            {task.description && <p>{task.description}</p>}
                          </button>
                          <div className="task-tags">
                            {task.tags.map((tag) => <span className="task-tag" key={tag}>{tag}</span>)}
                          </div>
                          <div className="task-footer">
                            <span className={`due-date ${task.status !== 'done' && task.dueDate < new Date().toISOString().slice(0, 10) ? 'overdue' : ''}`}>
                              <CalendarDays size={13} /> {formatDate(task.dueDate)}
                            </span>
                            <span className={`avatar avatar-${initials(task.owner).toLowerCase()}`} title={task.owner}>
                              {initials(task.owner)}
                            </span>
                          </div>
                        </article>
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="empty-column">
                          <span><Check size={15} /></span>
                          <p>{normalizedQuery || priorityFilter !== 'all' || myTasksOnly ? 'No matching tasks' : 'Nothing here yet'}</p>
                        </div>
                      )}
                    </div>

                    <button className="add-task-inline" type="button" onClick={() => openCreate(column.id)}>
                      <Plus size={15} /> Add task
                    </button>
                  </section>
                )
              })}
            </div>
          </div>
          <p className="board-footnote"><span className="footnote-dot" /> Drag a task between columns to update its status.</p>
        </section>
      </main>

      {dialog && (
        <TaskDialog
          key={dialog.task?.id ?? `new-${dialog.status}`}
          task={dialog.task}
          initialStatus={dialog.status}
          onClose={() => setDialog(null)}
          onSave={saveTask}
        />
      )}
    </div>
  )
}

function TaskDialog({
  task,
  initialStatus,
  onClose,
  onSave,
}: {
  task?: Task
  initialStatus: ColumnId
  onClose: () => void
  onSave: (task: Task) => void
}) {
  const [form, setForm] = useState<Task>(() => task ?? {
    id: '',
    title: '',
    description: '',
    status: initialStatus,
    priority: 'normal',
    tags: [],
    dueDate: '',
    owner: CURRENT_USER,
  })
  const [tagInput, setTagInput] = useState((task?.tags ?? []).join(', '))

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function update<K extends keyof Task>(key: K, value: Task[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({
      ...form,
      title: form.title.trim(),
      tags: tagInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header className="dialog-header">
          <div>
            <p className="dialog-eyebrow">TASK DETAILS</p>
            <h2 id="dialog-title">{task ? 'Edit task' : 'Create a task'}</h2>
          </div>
          <button className="icon-button" type="button" title="Close dialog" aria-label="Close dialog" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <label className="form-field title-field">
            <span>Task name</span>
            <input
              autoFocus
              required
              maxLength={120}
              placeholder="Give this task a clear name"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Description <small>Optional</small></span>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Add context or a useful next step"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </label>
          <div className="form-grid">
            <label className="form-field">
              <span>Status</span>
              <select value={form.status} onChange={(event) => update('status', event.target.value as ColumnId)}>
                {columns.map((column) => <option value={column.id} key={column.id}>{column.title}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Priority</span>
              <select value={form.priority} onChange={(event) => update('priority', event.target.value as Priority)}>
                {(Object.keys(priorityLabels) as Priority[]).map((priority) => <option value={priority} key={priority}>{priorityLabels[priority]}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Assignee</span>
              <select value={form.owner} onChange={(event) => update('owner', event.target.value)}>
                {owners.map((owner) => <option value={owner} key={owner}>{owner}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Due date</span>
              <input type="date" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
            </label>
          </div>
          <label className="form-field">
            <span>Labels <small>Separate with commas</small></span>
            <input
              placeholder="Design, Research"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
            />
          </label>
          <footer className="dialog-actions">
            <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit">
              {task ? <Check size={16} /> : <Plus size={16} />}
              {task ? 'Save changes' : 'Create task'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default App
