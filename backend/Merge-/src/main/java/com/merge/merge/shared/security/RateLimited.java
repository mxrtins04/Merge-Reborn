package com.merge.merge.shared.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    /** Prefix for the Redis key, e.g. "login" or "register". */
    String key();

    int limit();

    long windowSeconds();

    /**
     * When true, also rate limit by email, extracted from the first method
     * argument implementing {@link HasEmail}, independently of the always-on
     * IP-based limit.
     */
    boolean byEmail() default false;
}
