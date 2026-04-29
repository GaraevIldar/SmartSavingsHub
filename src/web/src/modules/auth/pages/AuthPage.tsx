import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GradientBackground } from '../../../shared/components/GradientBackground/GradientBackground'
import { AuthCard } from '../components/AuthCard'
import styles from './AuthPage.module.scss'

export const AuthPage: React.FC = () => {
    const navigate = useNavigate()
    const [isLogin, setIsLogin] = useState(true)

    const handleLogin = (email: string, password: string) => {
        console.log('Login:', email, password)
        // Здесь будет логика авторизации
        navigate('/profile')
    }

    const handleRegister = (username: string, email: string, password: string, confirmPassword: string) => {
        console.log('Register:', username, email, password, confirmPassword)
        // Здесь будет логика регистрации
        navigate('/profile')
    }

    const toggleMode = () => {
        setIsLogin(!isLogin)
    }

    return (
        <GradientBackground>
            <div className={styles.container}>
                <AuthCard
                    isLogin={isLogin}
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onToggleMode={toggleMode}
                />
            </div>
        </GradientBackground>
    )
}