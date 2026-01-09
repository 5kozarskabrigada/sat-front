import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 60 * 1000 // 1 minute

export function useFetch<T>(url: string, key: string) {
    const { token } = useAuthStore()
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSlow, setIsSlow] = useState(false)

    const fetchData = async (force = false) => {
        // Check cache first
        if (!force && cache.has(key)) {
            const cached = cache.get(key)!
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                setData(cached.data)
                setLoading(false)
                return
            }
        }

        setLoading(true)
        setIsSlow(false)
        setError(null)

        // Set a timer to mark request as slow after 5 seconds
        const slowTimer = setTimeout(() => {
            setIsSlow(true)
        }, 5000)

        try {
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            })
            cache.set(key, { data: res.data, timestamp: Date.now() })
            setData(res.data)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to fetch data')
        } finally {
            clearTimeout(slowTimer)
            setLoading(false)
            // Keep isSlow true if it finished but took long? No, reset it. 
            // Actually, if it errored, we might want to show error. If it finished, isSlow is irrelevant.
        }
    }

    useEffect(() => {
        fetchData()
    }, [url, key])

    // Expose a mutate function to manually refresh
    const mutate = () => fetchData(true)

    return { data, loading, error, isSlow, mutate }
}
