import React, { useState } from 'react'
import styles from './AuthCard.module.scss'
import { Icon } from '../../../shared/components/Icon/Icon'

interface AuthCardProps {
    isLogin: boolean
    onLogin: (email: string, password: string) => void
    onRegister: (username: string, email: string, password: string, confirmPassword: string) => void
    onToggleMode: () => void
}

export const AuthCard: React.FC<AuthCardProps> = ({
                                                      isLogin,
                                                      onLogin,
                                                      onRegister,
                                                      onToggleMode,
                                                  }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateLogin = (): boolean => {
        const newErrors: Record<string, string> = {}
        if (!email.trim()) newErrors.email = 'Введите email'
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Неверный формат email'
        if (!password) newErrors.password = 'Введите пароль'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validateRegister = (): boolean => {
        const newErrors: Record<string, string> = {}
        if (!username.trim()) newErrors.username = 'Введите имя пользователя'
        else if (username.length < 3) newErrors.username = 'Минимум 3 символа'
        if (!email.trim()) newErrors.email = 'Введите email'
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Неверный формат email'
        if (!password) newErrors.password = 'Введите пароль'
        else if (password.length < 6) newErrors.password = 'Минимум 6 символов'
        if (password !== confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isLogin) {
            if (validateLogin()) onLogin(email, password)
        } else {
            if (validateRegister()) onRegister(username, email, password, confirmPassword)
        }
    }

    return (
        <div className={styles.card}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>N</span>
                <span className={styles.logoText}>NexTalk</span>
            </div>

            <h1 className={styles.title}>
                {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
            </h1>
            <p className={styles.subtitle}>
                {isLogin
                    ? 'Войдите в свой аккаунт, чтобы продолжить'
                    : 'Заполните форму для регистрации'}
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
                {!isLogin && (
                    <div className={styles.field}>
                        <label className={styles.label}>
                            <Icon name="user" size={16} />
                            Имя пользователя
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Введите имя"
                            className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                        />
                        {errors.username && <span className={styles.error}>{errors.username}</span>}
                    </div>
                )}

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Icon name="mail" size={16} />
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.ru"
                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    />
                    {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        <Icon name="lock" size={16} />
                        Пароль
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    />
                    {errors.password && <span className={styles.error}>{errors.password}</span>}
                </div>

                {!isLogin && (
                    <div className={styles.field}>
                        <label className={styles.label}>
                            <Icon name="lock" size={16} />
                            Подтверждение пароля
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                        />
                        {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                    </div>
                )}

                <button type="submit" className={styles.submitBtn}>
                    <Icon name={isLogin ? "login" : "user-plus"} size={18} />
                    {isLogin ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </form>

            <div className={styles.footer}>
                <button onClick={onToggleMode} className={styles.toggleBtn}>
                    {isLogin
                        ? 'Нет аккаунта? Зарегистрироваться'
                        : 'Уже есть аккаунт? Войти'}
                </button>
            </div>
        </div>
    )
}