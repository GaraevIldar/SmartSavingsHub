import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/stores/authStore'
import { GradientBackground } from '../../../shared/components/GradientBackground/GradientBackground'
import { ProfileCard } from "../components/ProfileCard"
import styles from './ProfilePage.module.scss'

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        window.location.href = '/auth'
    }

    const handleEdit = () => {
        console.log('Edit profile')
    }

    return (
        <GradientBackground>
            <div className={styles.container}>
                <ProfileCard
                    user={{
                        id: user?.id || '1',
                        username: user?.username || 'User',
                        email: user?.email || 'user@example.com',
                        createdAt: new Date('2026-04-20'),
                        serversCount: 3,
                        status: 'online',
                    }}
                    onEdit={handleEdit}
                    onLogout={handleLogout}
                    onClose={() => navigate('/servers')}
                />
            </div>
        </GradientBackground>
    )
}