import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error')
}

// Component that works normally
const NoError = () => <div>No error occurred</div>

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NoError />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error occurred')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('resets error state when try again button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    // Error UI should be visible
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    // Click try again button
    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    tryAgainButton.click()

    // Render with non-error component
    rerender(
      <ErrorBoundary>
        <NoError />
      </ErrorBoundary>
    )

    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
  })

  it('displays error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/test error/i)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})
