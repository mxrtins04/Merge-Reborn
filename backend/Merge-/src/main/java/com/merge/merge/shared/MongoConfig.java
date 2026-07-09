package com.merge.merge.shared;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;

/**
 * Spring Boot does not autoconfigure a MongoTransactionManager the way it does
 * for JPA. Multi-document transactions require this bean to exist and a replica
 * set to be running (already confirmed via rs0). Registration is currently a
 * single-document write to the students collection and does not use this bean,
 * but future multi-document writes (e.g. cross-module XP + Context updates)
 * will depend on it being present.
 */
@Configuration
public class MongoConfig {

    @Bean
    public MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }
}
