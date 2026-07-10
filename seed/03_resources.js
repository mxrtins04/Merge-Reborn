// 03_resources.js — Seed learning resources for every concept.
//
// Run with:
//   mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" seed/03_resources.js
//
// Prerequisites: 02_concepts.js must have been run first.
// Idempotent: uses upsert on _id.
//
// Resource types used: DOCUMENTATION, ARTICLE, VIDEO, BOOK, COURSE, EXERCISE
// All URLs are real, publicly accessible educational resources.

// ─── Concept UUID helpers (must match 02_concepts.js) ────────────────────────
function sc(n) { return UUID(`20000000-1000-1000-1000-${String(n).padStart(12, "0")}`); }
function ca(n) { return UUID(`30000000-1000-1000-1000-${String(n).padStart(12, "0")}`); }
function bu(n) { return UUID(`40000000-1000-1000-1000-${String(n).padStart(12, "0")}`); }
function en(n) { return UUID(`50000000-1000-1000-1000-${String(n).padStart(12, "0")}`); }
function ar(n) { return UUID(`60000000-1000-1000-1000-${String(n).padStart(12, "0")}`); }

// Resource ID counter — resources get sequential IDs scoped to a prefix
let _seq = 1;
function rid() {
  const padded = String(_seq++).padStart(12, "0");
  return UUID(`99000000-0000-0000-0000-${padded}`);
}

const resources = [

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOUT concepts
  // ═══════════════════════════════════════════════════════════════════════════

  // SC01 — Computational Thinking
  { _id: rid(), conceptId: sc(1), type: "ARTICLE",       title: "Computational Thinking – Jeannette Wing (2006)", url: "https://www.cs.cmu.edu/~wing/publications/Wing06.pdf" },
  { _id: rid(), conceptId: sc(1), type: "VIDEO",         title: "CS50x 2024 – Week 0: Computational Thinking", url: "https://cs50.harvard.edu/x/2024/weeks/0/" },
  { _id: rid(), conceptId: sc(1), type: "COURSE",        title: "Computational Thinking – BBC Bitesize", url: "https://www.bbc.co.uk/bitesize/guides/zp92mp3/revision/1" },

  // SC02 — Clean Code Fundamentals
  { _id: rid(), conceptId: sc(2), type: "BOOK",          title: "Clean Code – Robert C. Martin", url: "https://www.oreilly.com/library/view/clean-code-a/9780136083238/" },
  { _id: rid(), conceptId: sc(2), type: "ARTICLE",       title: "Clean Code: Summary and Key Concepts", url: "https://gist.github.com/wojteklu/73f6914cc446146b179eead9f7f7c508" },
  { _id: rid(), conceptId: sc(2), type: "VIDEO",         title: "Clean Code – Uncle Bob Martin", url: "https://www.youtube.com/watch?v=7EmboKQH8lM" },

  // SC03 — Variables and Data Types
  { _id: rid(), conceptId: sc(3), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Variables", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/variables.html" },
  { _id: rid(), conceptId: sc(3), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Primitive Data Types", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html" },
  { _id: rid(), conceptId: sc(3), type: "ARTICLE",       title: "Java Primitives vs Objects – Baeldung", url: "https://www.baeldung.com/java-primitives-vs-objects" },

  // SC04 — Operators and Expressions
  { _id: rid(), conceptId: sc(4), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Operators", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/operators.html" },
  { _id: rid(), conceptId: sc(4), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Expressions, Statements, and Blocks", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/expressions.html" },
  { _id: rid(), conceptId: sc(4), type: "ARTICLE",       title: "Java Operators – Baeldung", url: "https://www.baeldung.com/java-operators" },

  // SC05 — Control Flow: Conditionals
  { _id: rid(), conceptId: sc(5), type: "DOCUMENTATION", title: "Oracle Java Tutorial: The if-then and if-then-else Statements", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/if.html" },
  { _id: rid(), conceptId: sc(5), type: "DOCUMENTATION", title: "Oracle Java Tutorial: The switch Statement", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/switch.html" },
  { _id: rid(), conceptId: sc(5), type: "ARTICLE",       title: "Java Switch Expressions (JEP 361) – Baeldung", url: "https://www.baeldung.com/java-switch" },

  // SC06 — Control Flow: Loops
  { _id: rid(), conceptId: sc(6), type: "DOCUMENTATION", title: "Oracle Java Tutorial: The while and do-while Statements", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/while.html" },
  { _id: rid(), conceptId: sc(6), type: "DOCUMENTATION", title: "Oracle Java Tutorial: The for Statement", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/for.html" },
  { _id: rid(), conceptId: sc(6), type: "ARTICLE",       title: "Guide to Java Loops – Baeldung", url: "https://www.baeldung.com/java-loops" },

  // SC07 — Functions
  { _id: rid(), conceptId: sc(7), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Defining Methods", url: "https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html" },
  { _id: rid(), conceptId: sc(7), type: "ARTICLE",       title: "Method Overloading in Java – Baeldung", url: "https://www.baeldung.com/java-method-overloading" },
  { _id: rid(), conceptId: sc(7), type: "VIDEO",         title: "CS50x 2024 – Week 1: Functions and Return Values", url: "https://cs50.harvard.edu/x/2024/weeks/1/" },

  // SC08 — Arrays and Lists
  { _id: rid(), conceptId: sc(8), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Arrays", url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html" },
  { _id: rid(), conceptId: sc(8), type: "ARTICLE",       title: "Java ArrayList – Baeldung", url: "https://www.baeldung.com/java-arraylist" },
  { _id: rid(), conceptId: sc(8), type: "ARTICLE",       title: "Java Arrays Guide – Baeldung", url: "https://www.baeldung.com/java-arrays-guide" },

  // SC09 — Strings
  { _id: rid(), conceptId: sc(9), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Strings", url: "https://docs.oracle.com/javase/tutorial/java/data/strings.html" },
  { _id: rid(), conceptId: sc(9), type: "ARTICLE",       title: "Java String API – Baeldung", url: "https://www.baeldung.com/java-string" },
  { _id: rid(), conceptId: sc(9), type: "ARTICLE",       title: "StringBuilder vs StringBuffer – Baeldung", url: "https://www.baeldung.com/java-string-builder-string-buffer" },

  // SC10 — Debugging Fundamentals
  { _id: rid(), conceptId: sc(10), type: "ARTICLE",      title: "How to Debug in IntelliJ IDEA – JetBrains", url: "https://www.jetbrains.com/help/idea/debugging-your-first-java-application.html" },
  { _id: rid(), conceptId: sc(10), type: "ARTICLE",      title: "Reading Java Stack Traces – Baeldung", url: "https://www.baeldung.com/java-stack-overflow-error" },
  { _id: rid(), conceptId: sc(10), type: "VIDEO",        title: "CS50x 2024 – Week 2: Debugging", url: "https://cs50.harvard.edu/x/2024/weeks/2/" },

  // SC11 — Testing Fundamentals
  { _id: rid(), conceptId: sc(11), type: "DOCUMENTATION", title: "JUnit 5 User Guide", url: "https://junit.org/junit5/docs/current/user-guide/" },
  { _id: rid(), conceptId: sc(11), type: "ARTICLE",      title: "Guide to JUnit 5 – Baeldung", url: "https://www.baeldung.com/junit-5" },
  { _id: rid(), conceptId: sc(11), type: "ARTICLE",      title: "Unit Testing Best Practices – Baeldung", url: "https://www.baeldung.com/java-unit-testing-best-practices" },

  // SC12 — Git Fundamentals
  { _id: rid(), conceptId: sc(12), type: "BOOK",         title: "Pro Git (free book) – Scott Chacon", url: "https://git-scm.com/book/en/v2" },
  { _id: rid(), conceptId: sc(12), type: "COURSE",       title: "Git Immersion – Step-by-Step Git Tutorial", url: "https://gitimmersion.com/" },
  { _id: rid(), conceptId: sc(12), type: "DOCUMENTATION", title: "GitHub Docs: Getting Started with Git", url: "https://docs.github.com/en/get-started/getting-started-with-git" },

  // SC13 — Big-O Notation
  { _id: rid(), conceptId: sc(13), type: "ARTICLE",      title: "Big O Cheat Sheet", url: "https://www.bigocheatsheet.com/" },
  { _id: rid(), conceptId: sc(13), type: "ARTICLE",      title: "Algorithm Complexity and Big-O Notation – Baeldung", url: "https://www.baeldung.com/java-algorithm-complexity" },
  { _id: rid(), conceptId: sc(13), type: "VIDEO",        title: "CS50x 2024 – Week 3: Algorithms and Big-O", url: "https://cs50.harvard.edu/x/2024/weeks/3/" },

  // SC14 — Memory and Storage
  { _id: rid(), conceptId: sc(14), type: "ARTICLE",      title: "Stack vs Heap Memory in Java – Baeldung", url: "https://www.baeldung.com/java-stack-heap" },
  { _id: rid(), conceptId: sc(14), type: "DOCUMENTATION", title: "Understanding Memory Management – Oracle", url: "https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html" },
  { _id: rid(), conceptId: sc(14), type: "VIDEO",        title: "CS50x 2024 – Week 4: Memory", url: "https://cs50.harvard.edu/x/2024/weeks/4/" },

  // SC15 — Core Data Structures
  { _id: rid(), conceptId: sc(15), type: "ARTICLE",      title: "Data Structures in Java – Baeldung", url: "https://www.baeldung.com/java-data-structures" },
  { _id: rid(), conceptId: sc(15), type: "VIDEO",        title: "CS50x 2024 – Week 5: Data Structures", url: "https://cs50.harvard.edu/x/2024/weeks/5/" },
  { _id: rid(), conceptId: sc(15), type: "COURSE",       title: "MIT 6.006 Introduction to Algorithms – OpenCourseWare", url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/" },

  // ═══════════════════════════════════════════════════════════════════════════
  // CADET concepts
  // ═══════════════════════════════════════════════════════════════════════════

  // CA01 — Object-Oriented Programming
  { _id: rid(), conceptId: ca(1), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Object-Oriented Programming Concepts", url: "https://docs.oracle.com/javase/tutorial/java/concepts/index.html" },
  { _id: rid(), conceptId: ca(1), type: "ARTICLE",       title: "Java OOP – Baeldung", url: "https://www.baeldung.com/java-oop" },
  { _id: rid(), conceptId: ca(1), type: "BOOK",          title: "Head First Object-Oriented Analysis and Design", url: "https://www.oreilly.com/library/view/head-first-object-oriented/0596008678/" },

  // CA02 — Encapsulation and Abstraction
  { _id: rid(), conceptId: ca(2), type: "DOCUMENTATION", title: "Oracle Java Tutorial: What Is an Object?", url: "https://docs.oracle.com/javase/tutorial/java/concepts/object.html" },
  { _id: rid(), conceptId: ca(2), type: "ARTICLE",       title: "Abstract Classes in Java – Baeldung", url: "https://www.baeldung.com/java-abstract-class" },
  { _id: rid(), conceptId: ca(2), type: "ARTICLE",       title: "Java Access Modifiers – Baeldung", url: "https://www.baeldung.com/java-access-modifiers" },

  // CA03 — Inheritance
  { _id: rid(), conceptId: ca(3), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Inheritance", url: "https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html" },
  { _id: rid(), conceptId: ca(3), type: "ARTICLE",       title: "Java Inheritance – Baeldung", url: "https://www.baeldung.com/java-inheritance" },
  { _id: rid(), conceptId: ca(3), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Overriding and Hiding Methods", url: "https://docs.oracle.com/javase/tutorial/java/IandI/override.html" },

  // CA04 — Polymorphism
  { _id: rid(), conceptId: ca(4), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Polymorphism", url: "https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html" },
  { _id: rid(), conceptId: ca(4), type: "ARTICLE",       title: "Polymorphism in Java – Baeldung", url: "https://www.baeldung.com/java-polymorphism" },
  { _id: rid(), conceptId: ca(4), type: "ARTICLE",       title: "Java instanceof Operator – Baeldung", url: "https://www.baeldung.com/java-instanceof" },

  // CA05 — Interfaces and Contracts
  { _id: rid(), conceptId: ca(5), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Interfaces", url: "https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html" },
  { _id: rid(), conceptId: ca(5), type: "ARTICLE",       title: "Java Interfaces – Baeldung", url: "https://www.baeldung.com/java-interfaces" },
  { _id: rid(), conceptId: ca(5), type: "ARTICLE",       title: "Functional Interfaces in Java 8 – Baeldung", url: "https://www.baeldung.com/java-8-functional-interfaces" },

  // CA06 — SOLID Principles
  { _id: rid(), conceptId: ca(6), type: "ARTICLE",       title: "A Solid Guide to SOLID Principles – Baeldung", url: "https://www.baeldung.com/solid-principles" },
  { _id: rid(), conceptId: ca(6), type: "BOOK",          title: "Clean Architecture – Robert C. Martin", url: "https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/" },
  { _id: rid(), conceptId: ca(6), type: "ARTICLE",       title: "SOLID Principles with Java Examples – DigitalOcean", url: "https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design" },

  // CA07 — Composition over Inheritance
  { _id: rid(), conceptId: ca(7), type: "ARTICLE",       title: "Inheritance vs Composition in Java – Baeldung", url: "https://www.baeldung.com/java-inheritance-composition" },
  { _id: rid(), conceptId: ca(7), type: "BOOK",          title: "Effective Java, 3rd Edition – Joshua Bloch", url: "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/" },
  { _id: rid(), conceptId: ca(7), type: "ARTICLE",       title: "Design Patterns: Decorator – Refactoring.Guru", url: "https://refactoring.guru/design-patterns/decorator" },

  // CA08 — Java Collections Framework
  { _id: rid(), conceptId: ca(8), type: "DOCUMENTATION", title: "Oracle Java Tutorial: The Collections Framework", url: "https://docs.oracle.com/javase/tutorial/collections/index.html" },
  { _id: rid(), conceptId: ca(8), type: "ARTICLE",       title: "Java Collections Framework – Baeldung", url: "https://www.baeldung.com/java-collections" },
  { _id: rid(), conceptId: ca(8), type: "ARTICLE",       title: "Java Collections Interview Questions – Baeldung", url: "https://www.baeldung.com/java-collections-interview-questions" },

  // CA09 — Exception Handling
  { _id: rid(), conceptId: ca(9), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Exceptions", url: "https://docs.oracle.com/javase/tutorial/essential/exceptions/index.html" },
  { _id: rid(), conceptId: ca(9), type: "ARTICLE",       title: "Exception Handling in Java – Baeldung", url: "https://www.baeldung.com/java-exceptions" },
  { _id: rid(), conceptId: ca(9), type: "ARTICLE",       title: "Best Practices for Exception Handling in Java – Baeldung", url: "https://www.baeldung.com/java-exception-handling-best-practices" },

  // CA10 — File I/O and Streams
  { _id: rid(), conceptId: ca(10), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Basic I/O", url: "https://docs.oracle.com/javase/tutorial/essential/io/index.html" },
  { _id: rid(), conceptId: ca(10), type: "ARTICLE",      title: "Reading and Writing Files in Java – Baeldung", url: "https://www.baeldung.com/reading-file-in-java" },
  { _id: rid(), conceptId: ca(10), type: "ARTICLE",      title: "Java NIO.2 File API – Baeldung", url: "https://www.baeldung.com/java-nio-2-file-api" },

  // CA11 — Lambdas and Functional Interfaces
  { _id: rid(), conceptId: ca(11), type: "DOCUMENTATION", title: "Oracle Java Tutorial: Lambda Expressions", url: "https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html" },
  { _id: rid(), conceptId: ca(11), type: "ARTICLE",      title: "Java 8 Stream API – Baeldung", url: "https://www.baeldung.com/java-8-streams" },
  { _id: rid(), conceptId: ca(11), type: "ARTICLE",      title: "Java 8 Functional Interfaces – Baeldung", url: "https://www.baeldung.com/java-8-functional-interfaces" },

  // CA12 — Design Patterns
  { _id: rid(), conceptId: ca(12), type: "BOOK",         title: "Design Patterns: Elements of Reusable Object-Oriented Software – Gang of Four", url: "https://www.oreilly.com/library/view/design-patterns-elements/0201633612/" },
  { _id: rid(), conceptId: ca(12), type: "ARTICLE",      title: "Design Patterns in Java – Refactoring.Guru", url: "https://refactoring.guru/design-patterns/java" },
  { _id: rid(), conceptId: ca(12), type: "ARTICLE",      title: "Java Design Patterns Series – Baeldung", url: "https://www.baeldung.com/design-patterns-series" },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILDER concepts
  // ═══════════════════════════════════════════════════════════════════════════

  // BU01 — Spring Boot Fundamentals
  { _id: rid(), conceptId: bu(1), type: "DOCUMENTATION", title: "Spring Boot Reference Documentation", url: "https://docs.spring.io/spring-boot/docs/current/reference/html/" },
  { _id: rid(), conceptId: bu(1), type: "COURSE",        title: "Building an Application with Spring Boot – Spring.io", url: "https://spring.io/guides/gs/spring-boot/" },
  { _id: rid(), conceptId: bu(1), type: "ARTICLE",       title: "Spring Boot Tutorial – Baeldung", url: "https://www.baeldung.com/spring-boot" },

  // BU02 — REST API Design
  { _id: rid(), conceptId: bu(2), type: "ARTICLE",       title: "RESTful Web Services with Spring – Baeldung", url: "https://www.baeldung.com/rest-with-spring-series" },
  { _id: rid(), conceptId: bu(2), type: "DOCUMENTATION", title: "HTTP Response Status Codes – MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status" },
  { _id: rid(), conceptId: bu(2), type: "ARTICLE",       title: "Richardson Maturity Model – Martin Fowler", url: "https://martinfowler.com/articles/richardsonMaturityModel.html" },

  // BU03 — Input Validation and Error Handling
  { _id: rid(), conceptId: bu(3), type: "ARTICLE",       title: "Spring Boot Bean Validation – Baeldung", url: "https://www.baeldung.com/spring-boot-bean-validation" },
  { _id: rid(), conceptId: bu(3), type: "ARTICLE",       title: "Exception Handling for REST with Spring – Baeldung", url: "https://www.baeldung.com/exception-handling-for-rest-with-spring" },
  { _id: rid(), conceptId: bu(3), type: "DOCUMENTATION", title: "Jakarta Bean Validation Specification", url: "https://beanvalidation.org/2.0/spec/" },

  // BU04 — Spring Security Fundamentals
  { _id: rid(), conceptId: bu(4), type: "DOCUMENTATION", title: "Spring Security Reference", url: "https://docs.spring.io/spring-security/reference/" },
  { _id: rid(), conceptId: bu(4), type: "ARTICLE",       title: "Spring Security Tutorial – Baeldung", url: "https://www.baeldung.com/security-spring" },
  { _id: rid(), conceptId: bu(4), type: "COURSE",        title: "Securing a Web Application – Spring.io", url: "https://spring.io/guides/gs/securing-web/" },

  // BU05 — JWT Authentication
  { _id: rid(), conceptId: bu(5), type: "DOCUMENTATION", title: "Introduction to JSON Web Tokens – jwt.io", url: "https://jwt.io/introduction" },
  { _id: rid(), conceptId: bu(5), type: "ARTICLE",       title: "Spring Security and JWT – Baeldung", url: "https://www.baeldung.com/spring-security-oauth-jwt" },
  { _id: rid(), conceptId: bu(5), type: "ARTICLE",       title: "Refresh Token Rotation – Auth0", url: "https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/" },

  // BU06 — PostgreSQL Fundamentals
  { _id: rid(), conceptId: bu(6), type: "DOCUMENTATION", title: "PostgreSQL Official Documentation", url: "https://www.postgresql.org/docs/current/" },
  { _id: rid(), conceptId: bu(6), type: "COURSE",        title: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com/" },
  { _id: rid(), conceptId: bu(6), type: "ARTICLE",       title: "EXPLAIN ANALYSE in PostgreSQL – Thoughtbot", url: "https://thoughtbot.com/blog/reading-an-explain-analyze-query-plan" },

  // BU07 — Spring Data JPA
  { _id: rid(), conceptId: bu(7), type: "DOCUMENTATION", title: "Spring Data JPA Reference", url: "https://docs.spring.io/spring-data/jpa/docs/current/reference/html/" },
  { _id: rid(), conceptId: bu(7), type: "ARTICLE",       title: "Introduction to Spring Data JPA – Baeldung", url: "https://www.baeldung.com/the-persistence-layer-with-spring-data-jpa" },
  { _id: rid(), conceptId: bu(7), type: "ARTICLE",       title: "Solving the N+1 Problem in Spring – Baeldung", url: "https://www.baeldung.com/spring-hibernate-n1-problem" },

  // BU08 — Database Transactions
  { _id: rid(), conceptId: bu(8), type: "ARTICLE",       title: "Spring @Transactional – Baeldung", url: "https://www.baeldung.com/transaction-configuration-with-jpa-and-spring" },
  { _id: rid(), conceptId: bu(8), type: "ARTICLE",       title: "Transaction Propagation and Isolation in Spring – Baeldung", url: "https://www.baeldung.com/spring-transactional-propagation-isolation" },
  { _id: rid(), conceptId: bu(8), type: "DOCUMENTATION", title: "Spring Framework: Transaction Management", url: "https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction" },

  // BU09 — Docker and Containerisation
  { _id: rid(), conceptId: bu(9), type: "DOCUMENTATION", title: "Docker Get Started Guide", url: "https://docs.docker.com/get-started/" },
  { _id: rid(), conceptId: bu(9), type: "COURSE",        title: "Spring Boot with Docker – Spring.io", url: "https://spring.io/guides/gs/spring-boot-docker/" },
  { _id: rid(), conceptId: bu(9), type: "DOCUMENTATION", title: "Dockerfile Best Practices – Docker", url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" },

  // BU10 — Integration and API Testing
  { _id: rid(), conceptId: bu(10), type: "ARTICLE",      title: "Testing in Spring Boot – Baeldung", url: "https://www.baeldung.com/spring-boot-testing" },
  { _id: rid(), conceptId: bu(10), type: "DOCUMENTATION", title: "Spring MVC Test Framework", url: "https://docs.spring.io/spring-framework/docs/current/reference/html/testing.html#spring-mvc-test-framework" },
  { _id: rid(), conceptId: bu(10), type: "DOCUMENTATION", title: "Testcontainers for Java", url: "https://java.testcontainers.org/" },

  // BU11 — CI/CD and Deployment
  { _id: rid(), conceptId: bu(11), type: "DOCUMENTATION", title: "GitHub Actions Documentation", url: "https://docs.github.com/en/actions" },
  { _id: rid(), conceptId: bu(11), type: "ARTICLE",      title: "CI/CD Pipeline Best Practices – Red Hat", url: "https://www.redhat.com/en/topics/devops/what-is-ci-cd" },
  { _id: rid(), conceptId: bu(11), type: "ARTICLE",      title: "GitHub Actions for Java CI – Baeldung", url: "https://www.baeldung.com/github-actions-spring-boot-ci" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINEER concepts
  // ═══════════════════════════════════════════════════════════════════════════

  // EN01 — System Design Foundations
  { _id: rid(), conceptId: en(1), type: "BOOK",          title: "Designing Data-Intensive Applications – Martin Kleppmann", url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/" },
  { _id: rid(), conceptId: en(1), type: "ARTICLE",       title: "The System Design Primer – Donne Martin", url: "https://github.com/donnemartin/system-design-primer" },
  { _id: rid(), conceptId: en(1), type: "ARTICLE",       title: "CAP Theorem – IBM", url: "https://www.ibm.com/topics/cap-theorem" },

  // EN02 — Distributed Systems Concepts
  { _id: rid(), conceptId: en(2), type: "VIDEO",         title: "Distributed Systems Lecture Series – Martin Kleppmann, Cambridge", url: "https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB" },
  { _id: rid(), conceptId: en(2), type: "ARTICLE",       title: "The Eight Fallacies of Distributed Computing – Arnon Rotem-Gal-Oz", url: "https://arnon.me/wp-content/uploads/Files/fallacies.pdf" },
  { _id: rid(), conceptId: en(2), type: "ARTICLE",       title: "Circuit Breaker Pattern – Martin Fowler", url: "https://martinfowler.com/bliki/CircuitBreaker.html" },

  // EN03 — Apache Kafka
  { _id: rid(), conceptId: en(3), type: "DOCUMENTATION", title: "Apache Kafka Official Documentation", url: "https://kafka.apache.org/documentation/" },
  { _id: rid(), conceptId: en(3), type: "ARTICLE",       title: "Introduction to Apache Kafka – Baeldung", url: "https://www.baeldung.com/apache-kafka" },
  { _id: rid(), conceptId: en(3), type: "COURSE",        title: "Kafka Quickstart", url: "https://kafka.apache.org/quickstart" },

  // EN04 — Redis and Caching
  { _id: rid(), conceptId: en(4), type: "DOCUMENTATION", title: "Redis Documentation", url: "https://redis.io/docs/" },
  { _id: rid(), conceptId: en(4), type: "ARTICLE",       title: "Introduction to Spring Data Redis – Baeldung", url: "https://www.baeldung.com/spring-data-redis-tutorial" },
  { _id: rid(), conceptId: en(4), type: "ARTICLE",       title: "Cache-Aside Pattern – Microsoft Azure", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside" },

  // EN05 — Horizontal Scaling Patterns
  { _id: rid(), conceptId: en(5), type: "ARTICLE",       title: "Scalability Best Practices – Microsoft Azure Architecture Center", url: "https://learn.microsoft.com/en-us/azure/architecture/best-practices/auto-scaling" },
  { _id: rid(), conceptId: en(5), type: "ARTICLE",       title: "Load Balancing Overview – NGINX", url: "https://www.nginx.com/resources/glossary/load-balancing/" },
  { _id: rid(), conceptId: en(5), type: "BOOK",          title: "Designing Data-Intensive Applications – Chapter 6: Partitioning", url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/" },

  // EN06 — Kubernetes
  { _id: rid(), conceptId: en(6), type: "DOCUMENTATION", title: "Kubernetes Official Documentation", url: "https://kubernetes.io/docs/home/" },
  { _id: rid(), conceptId: en(6), type: "COURSE",        title: "Kubernetes Basics Tutorial", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" },
  { _id: rid(), conceptId: en(6), type: "COURSE",        title: "Deploying Spring Boot to Kubernetes – Spring.io", url: "https://spring.io/guides/gs/spring-boot-kubernetes/" },

  // EN07 — Observability and Monitoring
  { _id: rid(), conceptId: en(7), type: "DOCUMENTATION", title: "Spring Boot Actuator Reference", url: "https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html" },
  { _id: rid(), conceptId: en(7), type: "ARTICLE",       title: "Spring Boot Metrics with Micrometer and Prometheus – Baeldung", url: "https://www.baeldung.com/micrometer" },
  { _id: rid(), conceptId: en(7), type: "DOCUMENTATION", title: "OpenTelemetry Documentation", url: "https://opentelemetry.io/docs/" },

  // EN08 — Performance Engineering
  { _id: rid(), conceptId: en(8), type: "DOCUMENTATION", title: "HotSpot Virtual Machine Performance Tuning Guide – Oracle", url: "https://docs.oracle.com/en/java/javase/21/gctuning/" },
  { _id: rid(), conceptId: en(8), type: "ARTICLE",       title: "Microbenchmarking with JMH – Baeldung", url: "https://www.baeldung.com/java-microbenchmark-harness" },
  { _id: rid(), conceptId: en(8), type: "ARTICLE",       title: "async-profiler: Profiling Java Applications", url: "https://github.com/async-profiler/async-profiler" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHITECT concepts
  // ═══════════════════════════════════════════════════════════════════════════

  // AR01 — Domain-Driven Design
  { _id: rid(), conceptId: ar(1), type: "BOOK",          title: "Domain-Driven Design – Eric Evans", url: "https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/" },
  { _id: rid(), conceptId: ar(1), type: "ARTICLE",       title: "Domain-Driven Design – Martin Fowler", url: "https://martinfowler.com/bliki/DomainDrivenDesign.html" },
  { _id: rid(), conceptId: ar(1), type: "ARTICLE",       title: "Hexagonal Architecture with DDD and Spring – Baeldung", url: "https://www.baeldung.com/hexagonal-architecture-ddd-spring" },

  // AR02 — CQRS
  { _id: rid(), conceptId: ar(2), type: "ARTICLE",       title: "CQRS – Martin Fowler", url: "https://martinfowler.com/bliki/CQRS.html" },
  { _id: rid(), conceptId: ar(2), type: "ARTICLE",       title: "CQRS and Event Sourcing in Java – Baeldung", url: "https://www.baeldung.com/cqrs-event-sourcing-java" },
  { _id: rid(), conceptId: ar(2), type: "DOCUMENTATION", title: "Axon Framework Reference Guide", url: "https://docs.axoniq.io/axon-framework-reference/" },

  // AR03 — Event Sourcing
  { _id: rid(), conceptId: ar(3), type: "ARTICLE",       title: "Event Sourcing – Martin Fowler", url: "https://martinfowler.com/eaaDev/EventSourcing.html" },
  { _id: rid(), conceptId: ar(3), type: "VIDEO",         title: "CQRS and Event Sourcing – Greg Young", url: "https://www.youtube.com/watch?v=8JKjvY4etTY" },
  { _id: rid(), conceptId: ar(3), type: "ARTICLE",       title: "Introduction to Event Sourcing – Baeldung", url: "https://www.baeldung.com/cqrs-event-sourcing-java" },

  // AR04 — Platform Engineering
  { _id: rid(), conceptId: ar(4), type: "ARTICLE",       title: "What is Platform Engineering? – platformengineering.org", url: "https://platformengineering.org/blog/what-is-platform-engineering" },
  { _id: rid(), conceptId: ar(4), type: "DOCUMENTATION", title: "Backstage: Open-Source IDP Framework", url: "https://backstage.io/docs/overview/what-is-backstage" },
  { _id: rid(), conceptId: ar(4), type: "BOOK",          title: "Team Topologies – Matthew Skelton & Manuel Pais", url: "https://teamtopologies.com/book" },

  // AR05 — Architecture Patterns and Trade-offs
  { _id: rid(), conceptId: ar(5), type: "BOOK",          title: "Building Evolutionary Architectures – Ford, Parsons, Kua", url: "https://www.oreilly.com/library/view/building-evolutionary-architectures/9781491986356/" },
  { _id: rid(), conceptId: ar(5), type: "ARTICLE",       title: "Architecture Decision Records – ADR GitHub", url: "https://adr.github.io/" },
  { _id: rid(), conceptId: ar(5), type: "ARTICLE",       title: "Microservices – Martin Fowler", url: "https://martinfowler.com/articles/microservices.html" },

  // AR06 — Technical Leadership
  { _id: rid(), conceptId: ar(6), type: "BOOK",          title: "Staff Engineer: Leadership Beyond the Management Track – Will Larson", url: "https://staffeng.com/book" },
  { _id: rid(), conceptId: ar(6), type: "BOOK",          title: "The Manager's Path – Camille Fournier", url: "https://www.oreilly.com/library/view/the-managers-path/9781491973882/" },
  { _id: rid(), conceptId: ar(6), type: "ARTICLE",       title: "On Being a Staff Engineer – Will Larson", url: "https://staffeng.com/guides/staff-archetypes/" },

  // AR07 — Site Reliability Engineering
  { _id: rid(), conceptId: ar(7), type: "BOOK",          title: "Site Reliability Engineering – Google (free online)", url: "https://sre.google/sre-book/table-of-contents/" },
  { _id: rid(), conceptId: ar(7), type: "ARTICLE",       title: "SLIs, SLOs, and Error Budgets – Google SRE", url: "https://sre.google/sre-book/service-level-objectives/" },
  { _id: rid(), conceptId: ar(7), type: "ARTICLE",       title: "Principles of Chaos Engineering – Chaos Engineering", url: "https://principlesofchaos.org/" }
];

// ─── Upsert all resources ────────────────────────────────────────────────────
resources.forEach(r => {
  db.resources.updateOne(
    { _id: r._id },
    { $set: { conceptId: r.conceptId, type: r.type, title: r.title, url: r.url } },
    { upsert: true }
  );
});

print(`✓ ${resources.length} resources seeded (3 per concept × 53 concepts)`);
