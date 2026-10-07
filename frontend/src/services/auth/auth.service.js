import { apiClient } from "../core/api.client.js";

async function registerAccount(formData) {
  try {
    clearSessionData(); 
    const res = await apiClient.post("/api/auth/register", formData);
    return { user: res.data.user };
  } catch (err) {
    throw parseAuthException(err);
  }
}

async function loginAccount(credentials) {
  try {
    clearSessionData();

    const res = await apiClient.post("/api/auth/login", credentials);

    const token = res.data.accessToken || res.data.token;
    const user = res.data.user;

    if (token) {
      localStorage.setItem("authToken", token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    if (user) {
      localStorage.setItem("activeUser", JSON.stringify(user));
    }

    return { user, token };
  } catch (err) {
    clearSessionData();
    throw parseAuthException(err);
  }
}

async function verifyActiveSession() {
  try {
    const token = retrieveAuthToken();
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    const res = await apiClient.get("/api/auth/me");
    const profile = res.data.user || res.data;
    localStorage.setItem("activeUser", JSON.stringify(profile));
    return profile;
  } catch (err) {
    clearSessionData();
    throw parseAuthException(err);
  }
}

function clearSessionData() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("activeUser");
  delete apiClient.defaults.headers.common["Authorization"];
}

function retrieveAuthToken() {
  return localStorage.getItem("authToken");
}

function retrieveCachedUser() {
  const cachedData = localStorage.getItem("activeUser");
  if (!cachedData) return null;

  try {
    return JSON.parse(cachedData);
  } catch {
    localStorage.removeItem("activeUser");
    return null;
  }
}

function parseAuthException(error) {
  if (!error.response) {
    return new Error("Server connection failed. Please check your network.");
  }

  const statusCode = error.response.status;
  const serverMsg = error.response.data?.msg || error.response.data?.message;

  if (statusCode === 400)
    return new Error(serverMsg || "Invalid data submitted.");
  if (statusCode === 401)
    return new Error(serverMsg || "Invalid email or password.");
  if (statusCode === 500) return new Error("Internal server error.");

  return new Error(serverMsg || "An unexpected error occurred.");
}

export const authService = {
  registerAccount,
  loginAccount,
  verifyActiveSession,
  clearSessionData,
  retrieveAuthToken,
  retrieveCachedUser,
};