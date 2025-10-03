import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import WorkerLogin from '@/app/worker/login/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Worker Login Page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    localStorage.clear()
  })

  it('renders login form with all required fields', () => {
    render(<WorkerLogin />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })

  it('validates email format', async () => {
    render(<WorkerLogin />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('validates required fields', async () => {
    render(<WorkerLogin />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('submits form with valid credentials', async () => {
    const mockResponse = {
      token: 'test-token-123',
      user: {
        id: 'worker-1',
        email: 'worker@test.com',
        role: 'worker',
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<WorkerLogin />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'worker@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'worker@test.com',
            password: 'Password123!',
            role: 'worker',
          }),
        })
      )
    })

    await waitFor(() => {
      expect(localStorage.getItem('hh-token')).toBe('test-token-123')
      expect(localStorage.getItem('hh-user')).toBe(JSON.stringify(mockResponse.user))
      expect(mockPush).toHaveBeenCalledWith('/worker/dashboard')
    })
  })

  it('displays error message on failed login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
    })

    render(<WorkerLogin />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'worker@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
    expect(localStorage.getItem('hh-token')).toBeNull()
  })

  it('disables submit button while loading', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<WorkerLogin />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'worker@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })

  it('has link to registration page', () => {
    render(<WorkerLogin />)

    const registerLink = screen.getByRole('link', { name: /register here/i })
    expect(registerLink).toHaveAttribute('href', '/worker/register/step-1')
  })

  it('has link to household login', () => {
    render(<WorkerLogin />)

    const householdLink = screen.getByRole('link', { name: /household/i })
    expect(householdLink).toHaveAttribute('href', '/household/login')
  })
})
