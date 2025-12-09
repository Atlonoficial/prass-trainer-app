import { useEffect, useRef } from 'react'
import { StudentBannerDisplay } from './StudentBannerDisplay'
import { useStableUserType } from '@/hooks/useStableUserType'
import { logger } from '@/lib/logger'

interface BannerContainerProps {
  placement: 'header' | 'between-sections' | 'footer'
  maxBanners?: number
  className?: string
}

export function BannerContainer({
  placement,
  className,
  maxBanners = 3
}: BannerContainerProps) {
  const { isStudent, loading, userType, teacherId } = useStableUserType()
  const hasLoggedRef = useRef(false)

  // Log only once on mount and when userType changes
  useEffect(() => {
    if (!loading && !hasLoggedRef.current) {
      hasLoggedRef.current = true
      logger.debug('BannerContainer', 'User type resolved', {
        placement,
        isStudent,
        userType,
        teacherId
      })
    }
  }, [loading, isStudent, userType, teacherId, placement])

  if (loading) {
    return null
  }

  // Bloqueia APENAS se NÃO for estudante
  if (!isStudent && userType !== 'student') {
    return null
  }

  return (
    <div className={className}>
      <StudentBannerDisplay
        placement={placement}
        maxBanners={maxBanners}
        className={className}
      />
    </div>
  )
}
