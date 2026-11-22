function Header({ email }) {
  return (
    <header>
      <h1>Todo List</h1>
      {email && <p>Signed in as {email}</p>}
    </header>
  );
}

export default Header;