import { useState } from 'react';

function TodoListItem({ todo, onCompleteTodo, onUpdateTodo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  function startEditing() {
    setEditedTitle(todo.title);
    setIsEditing(true);
  }

  function handleSave(event) {
    event.preventDefault();
    const title = editedTitle.trim();
    if (!title) return;

    setIsEditing(false);
    if (title !== todo.title) {
      onUpdateTodo({ ...todo, title });
    }
  }

  return (
    <li>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <label htmlFor={`edit-${todo.id}`}>Edit todo</label>
          <input
            id={`edit-${todo.id}`}
            value={editedTitle}
            onChange={(event) => setEditedTitle(event.target.value)}
            autoFocus
            required
          />
          <button type="submit" disabled={!editedTitle.trim()}>
            Save
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <label>
            <input
              type="checkbox"
              checked={todo.isCompleted}
              disabled={todo.isSaving}
              onChange={() => onCompleteTodo(todo.id)}
            />
            {todo.title}
          </label>
          <button type="button" disabled={todo.isSaving} onClick={startEditing}>
            Edit
          </button>
        </>
      )}
    </li>
  );
}

export default TodoListItem;