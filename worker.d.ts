declare module "*worker" {
  const code: () => Worker;
  export default code;
}
