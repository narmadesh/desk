export const setToken = (token:string): void | null => {
  if (typeof window === "undefined") return null;
  return localStorage.setItem(btoa("token"),btoa(token));
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return atob(localStorage.getItem(btoa("token")) as string);
};

export const removeToken = (): void | null => {
  return localStorage.removeItem(btoa('token'));
}