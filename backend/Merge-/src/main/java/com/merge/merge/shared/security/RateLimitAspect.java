package com.merge.merge.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    @Before("@annotation(rateLimited)")
    public void checkRateLimit(JoinPoint joinPoint, RateLimited rateLimited) {
        HttpServletRequest request =
                ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();

        String ip = clientIp(request);
        rateLimitService.checkAndIncrement(rateLimited.key() + ":ip:" + ip,
                rateLimited.limit(), rateLimited.windowSeconds());

        if (rateLimited.byEmail()) {
            for (Object arg : joinPoint.getArgs()) {
                if (arg instanceof HasEmail hasEmail) {
                    rateLimitService.checkAndIncrement(rateLimited.key() + ":email:" + hasEmail.email(),
                            rateLimited.limit(), rateLimited.windowSeconds());
                    break;
                }
            }
        }
    }

    private static String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
