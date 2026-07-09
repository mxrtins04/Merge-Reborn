package com.merge.merge.shared.security;

import com.merge.merge.identity.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * The real Spring Security integration point, not a custom lookup mechanism.
 * Backs the DaoAuthenticationProvider used by the AuthenticationManager bean.
 *
 * <p>Looks up by Student.email, which carries a database-level unique index.
 * DaoAuthenticationProvider calls loadUserByUsername and then verifies the
 * password via PasswordEncoder — credential comparison is the framework's
 * responsibility, not ours.</p>
 */
@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final StudentRepository studentRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return studentRepository.findByEmail(email)
                .map(AuthenticatedUser::new)
                .orElseThrow(() -> new UsernameNotFoundException("No account for email: " + email));
    }
}
