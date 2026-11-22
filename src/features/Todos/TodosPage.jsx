import { useEffect, useState } from 'react';
import TodoForm from './TodoForm.jsx';
import TodoList from './TodoList/TodoList.jsx';

function TodosPage({ token }) {
  const [todoList, setTodoList] = useState([]);
  const [error, setError] = useState('');
  const [isTodoListLoading, setIsTodoListLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    async function fetchTodos() {
      setIsTodoListLoading(true);
      setError('');

      try {
        const response = await fetch('/api/tasks?page=0&limit=99', {
          headers: { 'X-CSRF-TOKEN': token },
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 401) throw new Error('Unauthorized.');
        if (!response.ok) throw new Error('Could not load your todos.');

        const data = await response.json();
        setTodoList(data.tasks);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setIsTodoListLoading(false);
      }
    }

    fetchTodos();
    return () => controller.abort();
  }, [token]);

  async function saveTodo(path, method, changes) {
    const response = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': token,
      },
      credentials: 'include',
      body: JSON.stringify(changes),
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}).`);
    }

    return response;
  }

  async function addTodo(todoTitle) {
    const newTodo = {
      id: `temp-${crypto.randomUUID()}`,
      title: todoTitle.trim(),
      isCompleted: false,
      isSaving: true,
    };

    setTodoList((previous) => [newTodo, ...previous]);

    try {
      const response = await saveTodo('/api/tasks', 'POST', {
        title: newTodo.title,
        isCompleted: false,
      });

      const data = await response.json();
      const savedTodo = data.task ?? data;

      if (savedTodo.id == null) {
        throw new Error('The server response was missing the saved todo ID.');
      }

      setTodoList((previous) =>
        previous.map((todo) => (todo.id === newTodo.id ? savedTodo : todo))
      );
    } catch (err) {
      setTodoList((previous) => previous.filter((todo) => todo.id !== newTodo.id));
      setError(`Could not add "${newTodo.title}". ${err.message}`);
    }
  }

  async function patchTodo(originalTodo, changes) {
    const id = originalTodo.id;

    setTodoList((previous) =>
      previous.map((todo) =>
        todo.id === id ? { ...todo, ...changes, isSaving: true } : todo
      )
    );

    try {
      await saveTodo(`/api/tasks/${id}`, 'PATCH', changes);

      setTodoList((previous) =>
        previous.map((todo) =>
          todo.id === id ? { ...todo, isSaving: false } : todo
        )
      );
    } catch (err) {
      setTodoList((previous) =>
        previous.map((todo) => (todo.id === id ? originalTodo : todo))
      );
      setError(`Could not update "${originalTodo.title}". ${err.message}`);
    }
  }

  async function completeTodo(id) {
    const originalTodo = todoList.find((todo) => todo.id === id);
    if (!originalTodo || originalTodo.isSaving) return;

    await patchTodo(originalTodo, { isCompleted: true });
  }

  async function updateTodo(editedTodo) {
    const originalTodo = todoList.find((todo) => todo.id === editedTodo.id);
    if (!originalTodo || originalTodo.isSaving) return;

    await patchTodo(originalTodo, {
      title: editedTodo.title.trim(),
      isCompleted: editedTodo.isCompleted,
    });
  }

  return (
    <section aria-label="Todos">
      {error && (
        <div>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setError('')}>
            Clear Error
          </button>
        </div>
      )}

      {isTodoListLoading ? (
        <p role="status">Loading todos...</p>
      ) : (
        <>
          <TodoForm onAddTodo={addTodo} />
          <TodoList
            todoList={todoList}
            onCompleteTodo={completeTodo}
            onUpdateTodo={updateTodo}
          />
        </>
      )}

      {todoList.some((todo) => todo.isSaving) && (
        <p role="status">Saving changes...</p>
      )}
    </section>
  );
}

export default TodosPage;