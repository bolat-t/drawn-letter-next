import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Drawn Letter',
        short_name: 'Drawn Letter',
        description: 'Send a hand-drawn digital letter.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f0e6',
        theme_color: '#f5f0e6',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
