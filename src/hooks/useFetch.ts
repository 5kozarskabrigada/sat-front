import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export const prefetch = async (url: string, key: string, token: string | null) => {
    if (!token) return
    if (cache.has(key)) {
        const cached = cache.get(key)!
        if (Date.now() - cached.timestamp < CACHE_DURATION) return // Already cached
    }
    try {
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
        cache.set(key, { data: res.data, timestamp: Date.now() })
    } catch (err) {
        console.error(`Prefetch failed for ${key}`, err)
    }
}

export function useFetch<T>(url: string, key: string) {
    const { token } = useAuthStore()
    // Initialize state from cache synchronously to prevent flicker
    const [data, setData] = useState<T | null>(() => {
        if (cache.has(key)) {
            const cached = cache.get(key)!
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.data
            }
        }
        return null
    })
    
    // Only set loading to true if we didn't get data from cache
    const [loading, setLoading] = useState(!data)
    const [error, setError] = useState<string | null>(null)
    const [isSlow, setIsSlow] = useState(false)

    const fetchData = async (force = false) => {
        // Check cache first (redundant for initial mount but needed for re-fetches)
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

        // Set a timer to mark request as slow after 15 seconds (increased from 5s for slow servers)
        const slowTimer = setTimeout(() => {
            setIsSlow(true)
        }, 15000)

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
