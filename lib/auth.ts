export async function getAdminFromToken() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.admin
  } catch (error) {
    console.error("Auth check error:", error)
    return null
  }
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })

    // Redirect to login page
    window.location.href = "/auth/login"
  } catch (error) {
    console.error("Logout error:", error)
  }
}
