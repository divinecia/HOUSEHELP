import { renderHook, waitFor } from '@testing-library/react'
import { useSWRData, useWorkerSummary, useHouseholdBookings } from '@/hooks/useSWRData'
import { SWRConfig } from 'swr'

// Mock fetch
global.fetch = jest.fn()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
    {children}
  </SWRConfig>
)

describe('useSWRData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test User' }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(
      () => useSWRData<typeof mockData>('/api/test'),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('handles fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })

    const { result } = renderHook(
      () => useSWRData('/api/test'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when shouldFetch is false', () => {
    renderHook(
      () => useSWRData('/api/test', false),
      { wrapper }
    )

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('includes authorization header when token exists', async () => {
    const token = 'test-token-123'
    localStorage.setItem('hh-token', token)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    renderHook(
      () => useSWRData('/api/test'),
      { wrapper }
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: { 'Authorization': `Bearer ${token}` },
        })
      )
    })
  })
})

describe('useWorkerSummary', () => {
  it('fetches worker summary with correct URL', async () => {
    const mockSummary = {
      total_earnings: 5000,
      completed_jobs: 25,
      rating: 4.8,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSummary,
    })

    const { result } = renderHook(
      () => useWorkerSummary('worker-123'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSummary)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/worker/dashboard/summary?worker_id=worker-123',
      expect.any(Object)
    )
  })

  it('does not fetch when workerId is null', () => {
    renderHook(
      () => useWorkerSummary(null),
      { wrapper }
    )

    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe('useHouseholdBookings', () => {
  it('fetches household bookings with correct URL', async () => {
    const mockBookings = {
      items: [
        { id: 1, service: 'Cleaning', status: 'confirmed' },
        { id: 2, service: 'Cooking', status: 'pending' },
      ],
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBookings,
    })

    const { result } = renderHook(
      () => useHouseholdBookings('household-456'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.data).toEqual(mockBookings)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/household/bookings?household_id=household-456',
      expect.any(Object)
    )
  })

  it('does not fetch when householdId is null', () => {
    renderHook(
      () => useHouseholdBookings(null),
      { wrapper }
    )

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
