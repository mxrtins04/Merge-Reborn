// 02_concepts.js — Seed all curriculum concepts across five stages.
//
// Run with:
//   mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" seed/02_concepts.js
//
// Prerequisites: 01_stages.js must have been run first.
// Idempotent: uses upsert on _id.
//
// The `order` field controls in-stage sequence. ConceptOrderInitializer will
// backfill order on startup if it detects gaps, but we set it explicitly here
// so the order is canonical from the first run.
//
// PredefinedContentRef shape:
//   failureScenario  — concrete mistake a student makes before mastering this concept
//   teachingObjective — what the student must be able to do after mastering it
//   coreContent      — the essential knowledge that makes up the concept

// ─── Stage IDs (must match 01_stages.js) ────────────────────────────────────
const SCOUT_ID    = UUID("10000000-1000-1000-1000-000000000001");
const CADET_ID    = UUID("10000000-1000-1000-1000-000000000002");
const BUILDER_ID  = UUID("10000000-1000-1000-1000-000000000003");
const ENGINEER_ID = UUID("10000000-1000-1000-1000-000000000004");
const ARCHITECT_ID= UUID("10000000-1000-1000-1000-000000000005");

// ─── Concept definitions ─────────────────────────────────────────────────────
const concepts = [

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOUT — Foundations of programming thinking and practice
  // ═══════════════════════════════════════════════════════════════════════════

  {
    _id: UUID("20000000-1000-1000-1000-000000000001"),
    stageId: SCOUT_ID,
    order: 1,
    predefinedContentRef: {
      failureScenario: "The student attempts to solve every problem by writing code immediately, without first understanding the problem or breaking it into smaller parts. They struggle to explain their reasoning, produce solutions that only work for the specific example given, and cannot generalise their approach to related problems.",
      teachingObjective: "Decompose a real-world problem into a finite, ordered set of unambiguous steps. Identify patterns, abstractions, and sub-problems. Express a solution as an algorithm before writing any code.",
      coreContent: "Computational thinking consists of four pillars: decomposition (breaking a problem into parts), pattern recognition (finding similarities), abstraction (filtering irrelevant detail), and algorithms (expressing step-by-step solutions). These skills are language-agnostic and underpin every engineering decision. Practise by describing everyday tasks as algorithms and using flowcharts or pseudocode to validate logic before implementation."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000002"),
    stageId: SCOUT_ID,
    order: 2,
    predefinedContentRef: {
      failureScenario: "The student writes code that works but is unreadable: single-letter variable names, functions hundreds of lines long, no consistent formatting, and comments that restate what the code does instead of why. A colleague cannot understand the code without asking the author.",
      teachingObjective: "Write code that communicates intent to a human reader without requiring explanation. Apply consistent naming conventions, keep functions focused on a single responsibility, and recognise when a comment is necessary versus when better naming removes the need for it.",
      coreContent: "Clean code is code that is easy to read, understand, and change. Key practices: meaningful, intention-revealing names; small functions that do one thing; no duplication (DRY); minimal comments — the code should explain itself; consistent formatting enforced by convention. Robert C. Martin's Clean Code and Google's style guides provide concrete rules. Clean code reduces defect density, eases onboarding, and lowers the cost of future changes."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000003"),
    stageId: SCOUT_ID,
    order: 3,
    predefinedContentRef: {
      failureScenario: "The student declares variables with vague names like 'x' or 'temp', uses the wrong type (e.g. storing a price as an integer, losing the decimal component), and is surprised when integer division truncates results. They are unsure when to use `long` versus `int` or when to prefer `double` over `float`.",
      teachingObjective: "Declare variables with descriptive names and the correct primitive or reference type for the data they hold. Predict the result of arithmetic operations across different numeric types. Distinguish between value types (primitives) and reference types (objects).",
      coreContent: "Java provides eight primitive types: byte, short, int, long, float, double, char, and boolean. Each has a fixed size and range. Reference types (String, arrays, objects) store a memory address. Variables are containers that hold a value or reference; they must be declared before use. Type conversion can be implicit (widening) or explicit (casting, with potential data loss). Naming conventions in Java follow camelCase for variables, with names expressing what the variable represents, not how it is stored."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000004"),
    stageId: SCOUT_ID,
    order: 4,
    predefinedContentRef: {
      failureScenario: "The student is confused by operator precedence, writes `a = b = c` expecting two independent assignments, and does not understand that `==` on objects compares references rather than values. They misread compound assignment operators and cannot predict the result of bitwise or shift operations.",
      teachingObjective: "Apply arithmetic, relational, logical, assignment, and bitwise operators correctly. Predict evaluation order using operator precedence rules. Distinguish reference equality (`==`) from value equality (`.equals()`) for object types.",
      coreContent: "Java operators are grouped by category: arithmetic (+, -, *, /, %), relational (==, !=, <, >, <=, >=), logical (&amp;&amp;, ||, !), bitwise (&, |, ^, ~, <<, >>), assignment (=, +=, -=, etc.), and ternary (? :). Precedence determines evaluation order when multiple operators appear in one expression; parentheses override precedence. Short-circuit evaluation in && and || means the right operand may not be evaluated. For object comparison, always use `.equals()` unless testing for the same object in memory."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000005"),
    stageId: SCOUT_ID,
    order: 5,
    predefinedContentRef: {
      failureScenario: "The student nests conditionals five levels deep when a single boolean expression would suffice, forgets to handle the else branch leading to unintended fall-through, and does not know when to prefer a `switch` statement over a chain of `if-else if` blocks. Edge-case inputs cause the code to take an unexpected path.",
      teachingObjective: "Express decision logic using `if`, `if-else`, `if-else if`, and `switch` statements. Reduce nesting by applying early-return and guard-clause patterns. Write conditions that are readable and account for every relevant case including edge cases.",
      coreContent: "Conditionals are the mechanism by which a program makes decisions. `if` evaluates a boolean expression; the body runs only when the expression is true. `else` handles the false branch. `if-else if` chains handle multiple mutually exclusive cases. `switch` compares a single expression against discrete values and is preferable when there are many distinct cases on the same variable. Java 14+ switch expressions return a value and use the arrow syntax, eliminating fall-through. Guard clauses invert conditions to handle exceptional cases early, reducing nesting and improving readability."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000006"),
    stageId: SCOUT_ID,
    order: 6,
    predefinedContentRef: {
      failureScenario: "The student writes a `while` loop that never terminates because the condition is never updated, or uses a `for` loop with an off-by-one error that causes an `ArrayIndexOutOfBoundsException`. They do not know when to use `break` or `continue`, and they cannot convert between `for`, `while`, and `do-while` loops.",
      teachingObjective: "Implement `for`, `while`, and `do-while` loops to repeat computation efficiently. Avoid infinite loops and off-by-one errors. Apply `break` and `continue` to control loop execution. Recognise when recursion is a cleaner alternative to iteration.",
      coreContent: "Loops execute a block of code repeatedly while a condition holds. A `for` loop is idiomatic when the number of iterations is known in advance. A `while` loop is idiomatic when the termination condition depends on runtime state. A `do-while` loop guarantees at least one execution. The enhanced `for` (for-each) loop iterates over arrays and collections without an explicit index. Off-by-one errors arise from using strict vs. non-strict inequality; always trace through the boundary values mentally. Infinite loops are caused by forgetting to update the loop variable; use the debugger to step through when the loop does not terminate as expected."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000007"),
    stageId: SCOUT_ID,
    order: 7,
    predefinedContentRef: {
      failureScenario: "The student duplicates logic across the codebase instead of extracting it into a function. Their functions accept ten parameters, perform multiple unrelated operations, and rely on global state. They cannot articulate what a function's return type means or how the call stack works.",
      teachingObjective: "Define and call methods with clear names, appropriate parameter lists, and a single well-defined return type. Apply the single-responsibility principle at the method level. Trace execution through the call stack and understand how method scope isolates local variables.",
      coreContent: "A method is a named, reusable block of code that accepts inputs (parameters), performs an action, and optionally returns a result. The method signature specifies the name, parameter types, and return type. The `void` return type signals that the method produces no value. Local variables exist only within the method's scope; they are allocated on the stack when the method is invoked and released on return. Method overloading allows multiple methods to share a name if their parameter lists differ. Pure functions — those that depend only on their inputs and produce no side effects — are easiest to reason about and test in isolation."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000008"),
    stageId: SCOUT_ID,
    order: 8,
    predefinedContentRef: {
      failureScenario: "The student accesses an array element without checking bounds, confuses zero-based indexing with one-based counting, and does not know how to traverse or manipulate an array without printing every step. They are unsure whether to use an `int[]` array or an `ArrayList<Integer>` and cannot explain the trade-off.",
      teachingObjective: "Declare, initialise, and traverse fixed-size arrays and dynamic `ArrayList` collections. Perform common operations: add, remove, search, sort, and copy. Select the appropriate data structure based on whether the size is known at compile time.",
      coreContent: "An array is a fixed-length, contiguous block of elements of the same type, indexed from 0. Access time is O(1). Size cannot change after creation. `ArrayList` is a resizable array-backed list from `java.util` that automatically grows when capacity is exceeded; it provides O(1) amortised add at the end but O(n) insertion or removal in the middle. Arrays are preferred when the size is fixed and performance is critical; ArrayList is preferred for dynamic collections. `Arrays.sort()` and `Collections.sort()` provide built-in sorting using a merge sort variant. `Arrays.copyOf()` creates a new array with specified length, copying elements from the source."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000009"),
    stageId: SCOUT_ID,
    order: 9,
    predefinedContentRef: {
      failureScenario: "The student concatenates strings inside a loop using `+`, causing O(n²) performance on large inputs. They are confused by the difference between `==` and `.equals()` on strings, and they do not know how to use format strings, split on a delimiter, or trim whitespace.",
      teachingObjective: "Manipulate strings using the methods of `java.lang.String`: substring, indexOf, contains, replace, split, trim, and format. Use `StringBuilder` when building strings incrementally. Apply `String.format()` or text blocks for readable output. Always compare strings with `.equals()` or `equalsIgnoreCase()`.",
      coreContent: "Strings in Java are immutable objects in the `java.lang` package; every operation that appears to modify a string actually creates a new one. The string pool interns literals, meaning two string literals with the same content share the same object — this is why `==` can return `true` for literals but is unreliable for general comparison. Key methods: `length()`, `charAt(int)`, `substring(int, int)`, `indexOf(String)`, `contains(CharSequence)`, `replace(CharSequence, CharSequence)`, `split(String)`, `trim()`, `toUpperCase()`, `toLowerCase()`, `isEmpty()`, `isBlank()`. `StringBuilder` is mutable and should be used when constructing strings via concatenation in a loop. Text blocks (Java 15+) allow multi-line strings with minimal escaping."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000010"),
    stageId: SCOUT_ID,
    order: 10,
    predefinedContentRef: {
      failureScenario: "When code does not behave as expected, the student's only strategy is to add `System.out.println` statements randomly and re-run. They do not set breakpoints, do not inspect variable state at the point of failure, and cannot read a stack trace to identify which line caused an exception.",
      teachingObjective: "Use a debugger to set breakpoints, step through code line by line, inspect variable values, and evaluate expressions at runtime. Read a Java stack trace and identify the root cause of an exception. Distinguish between compile-time errors, runtime exceptions, and logical bugs.",
      coreContent: "Debugging is the systematic process of finding and fixing the cause of incorrect behaviour. Three categories of bug exist: syntax errors (caught at compile time), runtime exceptions (thrown during execution, surfaced via stack trace), and logic errors (code runs but produces wrong output). The IDE debugger allows setting breakpoints (where execution pauses), stepping over or into method calls, watching variable values, and evaluating arbitrary expressions mid-execution. A stack trace lists the call stack at the point of the exception, reading top-to-bottom from the most recent frame to the root. Reading the exception type and message first narrows the search before examining the stack frames."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000011"),
    stageId: SCOUT_ID,
    order: 11,
    predefinedContentRef: {
      failureScenario: "The student considers testing optional and only runs their code manually against a single example. When asked to verify a fix did not break existing behaviour, they have no mechanism to check. They do not know what a unit test is, what it asserts, or how to write one in JUnit.",
      teachingObjective: "Write JUnit 5 unit tests for individual methods. Use `@Test`, `@BeforeEach`, and assertion methods from `Assertions`. Follow the Arrange-Act-Assert pattern. Understand what a test proves and what it does not, and articulate the difference between a passing test and correct code.",
      coreContent: "Testing is the discipline of verifying that code behaves correctly under defined conditions. A unit test exercises a single, isolated unit of code (typically one method) and makes assertions about its output. JUnit 5 is the standard Java testing framework: annotate a test method with `@Test`, use `Assertions.assertEquals`, `assertTrue`, `assertThrows`, etc. to verify outcomes. `@BeforeEach` sets up shared state before each test. The Arrange-Act-Assert (AAA) pattern structures a test as: set up inputs, call the unit under test, assert the result. Good tests are independent (order does not matter), fast, and deterministic. A test suite that passes does not prove correctness; it proves the tested cases pass."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000012"),
    stageId: SCOUT_ID,
    order: 12,
    predefinedContentRef: {
      failureScenario: "The student saves code by copying files to a folder named 'backup_v3_final_REAL'. They work directly on the main branch, cannot describe what a commit is, cannot reverse a mistake, and are blocked from collaborating because they do not understand branching or pull requests.",
      teachingObjective: "Use Git to initialise a repository, stage changes, commit with a meaningful message, push to a remote, create and merge branches, and resolve a simple merge conflict. Navigate commit history with `git log` and revert to a previous state with `git checkout` or `git restore`.",
      coreContent: "Git is a distributed version-control system. A repository stores the full history of a project as a sequence of commits. A commit is a snapshot of the working tree at a point in time; every commit has a unique SHA, an author, a timestamp, and a message. The working tree, staging area (index), and local repository are three distinct zones: `git add` moves changes to the staging area; `git commit` writes a snapshot to the local repository; `git push` sends commits to the remote. Branches are lightweight pointers to commits; `main` (or `master`) is the default. Feature branches isolate work-in-progress from stable code. A pull request (GitHub term) is a request to merge a branch into another after review. Merge conflicts occur when two branches modify the same lines; resolve by editing the conflicted file and committing the resolution."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000013"),
    stageId: SCOUT_ID,
    order: 13,
    predefinedContentRef: {
      failureScenario: "The student does not consider performance when choosing an algorithm, assumes that a nested loop over a list of 100,000 items will be fast enough, and cannot explain why a binary search is faster than a linear search. They conflate time complexity with actual execution time and cannot read or write Big-O expressions.",
      teachingObjective: "Express the time and space complexity of an algorithm using Big-O notation. Identify the complexity class of common patterns: O(1) lookup, O(log n) binary search, O(n) linear scan, O(n log n) comparison sort, O(n²) nested iteration. Use complexity analysis to choose between competing implementations.",
      coreContent: "Big-O notation describes how the resource usage of an algorithm grows as the input size n increases, ignoring constant factors and lower-order terms. Common complexity classes: O(1) constant — independent of input size; O(log n) logarithmic — binary search, balanced BST operations; O(n) linear — single pass over input; O(n log n) linearithmic — efficient comparison-based sorting (merge sort, quicksort average case); O(n²) quadratic — nested loops over the same input; O(2ⁿ) exponential — brute-force combinatorial problems. Space complexity applies the same analysis to memory usage. Best, average, and worst cases can differ; Big-O typically describes worst case. Amortised analysis averages cost over a sequence of operations."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000014"),
    stageId: SCOUT_ID,
    order: 14,
    predefinedContentRef: {
      failureScenario: "The student believes that declaring more variables always consumes more memory regardless of type, does not know the difference between stack and heap allocation, and cannot explain what happens to an object after the last reference to it is released. They are confused by `NullPointerException` and do not know what `null` represents.",
      teachingObjective: "Describe how the JVM allocates memory on the stack and the heap. Explain the lifecycle of an object from allocation to garbage collection. Interpret a `NullPointerException` and trace its cause. Describe the difference between value semantics (primitives) and reference semantics (objects).",
      coreContent: "The JVM manages two main memory regions. The stack stores method frames, local variables, and return addresses; it is thread-local, fast, and automatically reclaimed when the method returns. The heap stores all objects and arrays; it is shared across threads and managed by the garbage collector. When a variable is declared with a reference type, the variable holds a memory address (reference) to the actual object on the heap, not the object itself. `null` means a reference variable holds no address; dereferencing null causes a `NullPointerException`. The garbage collector periodically identifies objects with no live references and reclaims their memory — developers cannot control this directly, but can avoid memory leaks by not holding references longer than needed."
    }
  },

  {
    _id: UUID("20000000-1000-1000-1000-000000000015"),
    stageId: SCOUT_ID,
    order: 15,
    predefinedContentRef: {
      failureScenario: "The student uses an array for every collection problem regardless of access pattern, does not know what a stack or queue is, and cannot explain why a HashMap lookup is faster than scanning an ArrayList for a key. They are unaware that data structure choice determines algorithm complexity.",
      teachingObjective: "Select the appropriate data structure for a problem based on its access pattern. Describe the time complexity of the core operations (add, remove, search, access) for arrays, linked lists, stacks, queues, hash maps, and sets. Implement a stack and queue using Java collections.",
      coreContent: "A data structure organises data to support efficient operations. Arrays provide O(1) indexed access but O(n) insert/delete in the middle. Linked lists provide O(1) insert/delete at a known node but O(n) traversal to find a node. A stack (LIFO) supports push and pop in O(1); `Deque` is the Java idiomatic stack. A queue (FIFO) supports enqueue and dequeue in O(1); `LinkedList` and `ArrayDeque` implement `Queue`. A `HashMap` provides O(1) average key lookup, insert, and delete by computing a hash of the key; it requires keys to implement `hashCode()` and `equals()`. A `HashSet` stores unique elements with O(1) contains, add, and remove. A tree (e.g. `TreeMap`, `TreeSet`) stores elements in sorted order with O(log n) operations. Choosing the wrong data structure can turn an O(n) algorithm into O(n²)."
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CADET — Object-oriented design and the Java platform
  // ═══════════════════════════════════════════════════════════════════════════

  {
    _id: UUID("30000000-1000-1000-1000-000000000001"),
    stageId: CADET_ID,
    order: 1,
    predefinedContentRef: {
      failureScenario: "The student writes procedural code organised into a single massive class, passes dozens of primitive parameters between methods instead of passing objects, and cannot explain the relationship between a class and an object. They have heard of OOP but treat it as optional syntax rather than a design philosophy.",
      teachingObjective: "Model a real-world domain as a set of collaborating objects. Define classes with fields, constructors, and methods. Instantiate objects and invoke methods on them. Explain the difference between a class (blueprint) and an object (instance) and describe why OOP organises code around data rather than procedures.",
      coreContent: "Object-oriented programming models the world as a collection of objects that combine state (fields) and behaviour (methods). A class is a blueprint that defines the structure and behaviour of objects; an object is a runtime instance of a class. Constructors initialise the object's state. The `this` keyword refers to the current object instance inside a method. Objects communicate by sending messages (calling methods). OOP brings four core principles: encapsulation, abstraction, inheritance, and polymorphism. Classes should be organised around a coherent concept from the problem domain — a `Customer`, a `Product`, an `Order` — rather than around technical functions like `DataHandler` or `Processor`."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000002"),
    stageId: CADET_ID,
    order: 2,
    predefinedContentRef: {
      failureScenario: "The student makes every field `public`, allowing any class to directly read or modify internal state. When the internal representation changes, every caller breaks. They also define large concrete classes instead of identifying the minimal interface needed by callers, creating tight coupling throughout the codebase.",
      teachingObjective: "Apply encapsulation by restricting field access to `private` and exposing controlled mutation via public methods. Design abstractions that hide implementation detail behind a minimal, stable interface. Identify what to expose and what to keep hidden by thinking from the caller's perspective.",
      coreContent: "Encapsulation bundles state and behaviour together and protects state from uncontrolled modification. Fields should be `private` by default; access is provided through getter and setter methods only when genuinely needed. Encapsulation allows the internal representation to change without breaking callers (information hiding). Abstract classes define partial implementations that subclasses complete; they use the `abstract` keyword and cannot be instantiated directly. A good abstraction exposes a simple interface while hiding complex implementation details — the caller works with the what, not the how. The access modifiers `public`, `protected`, `default` (package-private), and `private` form a gradient of visibility."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000003"),
    stageId: CADET_ID,
    order: 3,
    predefinedContentRef: {
      failureScenario: "The student copies and pastes identical logic across multiple classes rather than extracting shared behaviour into a superclass. They override a method in a subclass but call the parent implementation incorrectly, or they create deep inheritance hierarchies five levels deep that are impossible to follow.",
      teachingObjective: "Use `extends` to create a subclass that inherits fields and methods from a superclass. Override methods to specialise behaviour, calling `super` when the parent implementation should be preserved. Recognise when inheritance is the right tool versus when it creates excessive coupling.",
      coreContent: "Inheritance allows a subclass to acquire the fields and methods of a superclass, enabling code reuse and expressing an is-a relationship. The `extends` keyword creates the subclass; `super()` calls the superclass constructor. Overriding replaces the parent method's implementation in the subclass; `@Override` annotation makes the intention explicit and causes a compile error if the method signature does not match. Java supports single inheritance for classes (a class can extend only one class) but multiple interface implementation. The Liskov Substitution Principle states that a subclass must be substitutable for its superclass without changing program correctness; violating it means inheritance is being misused. Deep inheritance trees (>3 levels) are a design smell."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000004"),
    stageId: CADET_ID,
    order: 4,
    predefinedContentRef: {
      failureScenario: "The student checks the runtime type of objects with `instanceof` chains and casts before calling type-specific methods, reproducing the exact problem that polymorphism is designed to solve. They do not understand how method dispatch selects the overridden version at runtime.",
      teachingObjective: "Invoke methods on a reference of a parent type and rely on dynamic dispatch to call the correct overridden implementation at runtime. Remove `instanceof` checks by pushing type-specific behaviour into the appropriate subclass. Understand the difference between compile-time type and runtime type.",
      coreContent: "Polymorphism allows a single method call to behave differently depending on the runtime type of the object. In Java, this is achieved through method overriding: a subclass provides a specific implementation of a method declared in the superclass or interface. When a method is called on a reference, the JVM uses dynamic dispatch to select the implementation defined by the actual runtime type, not the declared type of the reference. This eliminates the need for `instanceof` chains: instead of checking what type an object is and then calling the appropriate method, you call the same method on every object and let each type respond appropriately. Compile-time type determines which methods are visible; runtime type determines which override executes."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000005"),
    stageId: CADET_ID,
    order: 5,
    predefinedContentRef: {
      failureScenario: "The student implements concrete classes for every abstraction, creating tight coupling between components. When a dependency changes, every class that references it must be modified. They do not know what an interface is or why defining behaviour as a contract independent of implementation enables testability and flexibility.",
      teachingObjective: "Define an interface to express a contract — a set of method signatures — that multiple implementations can fulfil. Program to interfaces rather than concrete classes. Swap implementations without changing callers. Use interfaces to enable dependency injection and mock testing.",
      coreContent: "An interface in Java is a pure contract: it declares method signatures (and optionally constants and default methods) without providing implementation. Classes implement interfaces with the `implements` keyword and must provide a body for every abstract method. A class can implement multiple interfaces. Programming to an interface means declaring variable types as the interface type rather than the concrete type: `List<String> list = new ArrayList<>()` instead of `ArrayList<String> list = new ArrayList<>()`. This decouples the caller from the implementation and allows swapping the implementation (e.g. from ArrayList to LinkedList, or from a real service to a test double) without changing any calling code. Java 8 added `default` and `static` methods to interfaces, allowing backward-compatible evolution of the interface contract."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000006"),
    stageId: CADET_ID,
    order: 6,
    predefinedContentRef: {
      failureScenario: "The student writes classes that accumulate responsibilities over time, methods that are hundreds of lines long mixing business logic with I/O, and classes that are impossible to test because they directly instantiate their dependencies. They have not heard of SOLID or cannot connect the principles to concrete code decisions.",
      teachingObjective: "Apply each of the five SOLID principles to identify design problems and propose improvements. Refactor a class that violates SRP into focused, single-responsibility units. Apply OCP to add behaviour without modifying existing code. Apply DIP to depend on abstractions rather than concretions.",
      coreContent: "SOLID is an acronym for five principles of object-oriented design. Single Responsibility Principle (SRP): a class should have one reason to change; mixing concerns creates fragile, untestable code. Open-Closed Principle (OCP): classes should be open for extension but closed for modification; new behaviour is added by writing new code, not changing existing code. Liskov Substitution Principle (LSP): subtypes must be substitutable for their base types without breaking correctness. Interface Segregation Principle (ISP): prefer many small, focused interfaces over one large general-purpose interface; clients should not be forced to depend on methods they do not use. Dependency Inversion Principle (DIP): high-level modules should depend on abstractions, not on low-level concrete implementations."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000007"),
    stageId: CADET_ID,
    order: 7,
    predefinedContentRef: {
      failureScenario: "The student uses inheritance to reuse code even when there is no genuine is-a relationship, leading to subclasses that inherit methods that do not make sense for them. They have to override every inherited method to throw `UnsupportedOperationException`, a clear signal that inheritance is being misused.",
      teachingObjective: "Identify when inheritance is the wrong tool and replace it with composition. Use composition to assemble behaviour from small, focused collaborators rather than inheriting it from a superclass. Explain why 'favour composition over inheritance' applies and articulate the trade-offs.",
      coreContent: "Composition is the practice of building complex behaviour by combining small, focused objects rather than inheriting from a hierarchy. Where inheritance expresses is-a, composition expresses has-a. A `Car` is not a kind of `Engine`; it has an engine. Composition is more flexible: the composed behaviour can change at runtime by substituting a different collaborator, whereas inheritance is fixed at compile time. Delegation is the pattern by which a composed object delegates work to its collaborator: `car.accelerate()` delegates to `engine.ignite()`. The Decorator pattern is a canonical example of composition: it wraps an object and extends its behaviour without modifying the class. Composition reduces the risk of breaking the Liskov Substitution Principle because there is no inheritance hierarchy to violate."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000008"),
    stageId: CADET_ID,
    order: 8,
    predefinedContentRef: {
      failureScenario: "The student uses `ArrayList` for every collection regardless of access pattern, is unaware of `LinkedList`, `HashMap`, `HashSet`, `TreeMap`, or `PriorityQueue`, and cannot write code that exploits the specific performance characteristics of the collection chosen. They do not know how to iterate safely while removing elements.",
      teachingObjective: "Select the appropriate `java.util` collection type for a given access pattern. Use `Iterator` and `removeIf` for safe mutation during iteration. Apply `Collections` utility methods. Explain the performance characteristics of `ArrayList`, `LinkedList`, `HashMap`, `TreeMap`, `HashSet`, and `PriorityQueue`.",
      coreContent: "The Java Collections Framework provides a hierarchy of interfaces (`Collection`, `List`, `Set`, `Queue`, `Map`) and concrete implementations. `ArrayList`: random access O(1), add-at-end O(1) amortised, insert/remove O(n). `LinkedList`: add/remove at head/tail O(1), random access O(n); also implements `Deque`. `HashMap`: O(1) average get/put, unordered, allows one null key. `LinkedHashMap`: insertion-ordered HashMap. `TreeMap`: sorted by key, O(log n) operations. `HashSet`: O(1) contains/add/remove, uses hashCode and equals. `TreeSet`: sorted, O(log n). `PriorityQueue`: min-heap, O(log n) offer/poll, O(1) peek. `Collections.sort()`, `binarySearch()`, `unmodifiableList()`, `synchronizedList()`, `frequency()` are frequently used utilities. Never remove from a collection using its index inside a for-each loop; use `Iterator.remove()` or `removeIf()`."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000009"),
    stageId: CADET_ID,
    order: 9,
    predefinedContentRef: {
      failureScenario: "The student uses bare `catch (Exception e) {}` blocks that silently swallow errors, throws `Exception` from every method, and does not distinguish between recoverable and unrecoverable conditions. They are unaware of checked versus unchecked exceptions and how each affects the caller's contract.",
      teachingObjective: "Design an exception strategy that distinguishes checked exceptions (recoverable conditions callers must handle) from unchecked exceptions (programming errors). Catch only exceptions you can meaningfully handle. Include enough context in the exception message to diagnose the failure. Use `finally` and try-with-resources for guaranteed cleanup.",
      coreContent: "Java exceptions form a hierarchy rooted at `Throwable`. `Error` represents JVM-level failures not meant to be caught (e.g. `OutOfMemoryError`). `Exception` is the base of application-level exceptions. Checked exceptions (subclasses of `Exception` that are not `RuntimeException`) must be declared in the method signature with `throws` or caught; they model recoverable conditions. Unchecked exceptions (subclasses of `RuntimeException`) represent programming errors that callers are not expected to handle. Catch the most specific type possible; avoid `catch (Exception e)` unless re-throwing with additional context. Use try-with-resources (`try (Resource r = new Resource()) {}`) to guarantee that `Closeable` resources are released even if an exception occurs. Include the original exception as a `cause` when wrapping and re-throwing to preserve the stack trace."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000010"),
    stageId: CADET_ID,
    order: 10,
    predefinedContentRef: {
      failureScenario: "The student reads an entire file into memory as a `String` before processing it, does not close file handles, and does not know how to write to a file or process a file line by line. They conflate `InputStream` (raw bytes) with `Reader` (characters) and do not understand charset encoding.",
      teachingObjective: "Read and write files using `BufferedReader`, `BufferedWriter`, `Files` (NIO.2), and streams. Process files line by line without loading them entirely into memory. Use try-with-resources to guarantee resource cleanup. Choose the correct abstraction for binary data versus text data.",
      coreContent: "Java I/O is organised in two layers: byte streams (`InputStream`/`OutputStream`) handle raw binary data; character streams (`Reader`/`Writer`) handle text with a specified charset. Wrapping a `FileInputStream` in a `BufferedInputStream` (or a `FileReader` in a `BufferedReader`) adds buffering, reducing system call overhead. `Files.readAllLines(path)` is convenient for small files; `Files.lines(path)` returns a lazy `Stream<String>` suitable for large files. `Files.write(path, lines)` and `Files.writeString(path, content)` cover most write use cases. Always specify charset explicitly (`StandardCharsets.UTF_8`); never rely on the platform default. try-with-resources is mandatory — unclosed streams can leak file descriptors and cause data corruption. `Path` (NIO.2) is preferred over the legacy `File` class for new code."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000011"),
    stageId: CADET_ID,
    order: 11,
    predefinedContentRef: {
      failureScenario: "The student writes verbose anonymous inner classes where a lambda would be clearer, does not know what a functional interface is, and cannot use `stream()` to filter, map, or collect a collection. They reach for an explicit loop when a single `stream().filter().map().collect()` chain would be more readable.",
      teachingObjective: "Replace anonymous inner classes with lambda expressions where the target type is a functional interface. Compose stream pipelines using `filter`, `map`, `flatMap`, `sorted`, `distinct`, `limit`, `reduce`, and `collect`. Select the appropriate `Collector` for the result type. Use method references (`Class::method`) to improve readability.",
      coreContent: "A lambda expression is a concise way to represent an anonymous function: `(params) -> body`. The target type must be a functional interface — an interface with exactly one abstract method (SAM type). Built-in functional interfaces in `java.util.function`: `Predicate<T>` (test), `Function<T,R>` (apply), `Consumer<T>` (accept), `Supplier<T>` (get), `BiFunction<T,U,R>`. The Stream API processes sequences of elements lazily through a pipeline of operations. Intermediate operations (filter, map, sorted, distinct, limit, peek) return a new stream; they are lazy and not executed until a terminal operation is reached. Terminal operations (collect, forEach, reduce, count, findFirst, anyMatch) trigger the pipeline. `Collectors.toList()`, `toSet()`, `toMap()`, `groupingBy()`, and `joining()` cover the most common collection scenarios. Streams do not modify the underlying data source."
    }
  },

  {
    _id: UUID("30000000-1000-1000-1000-000000000012"),
    stageId: CADET_ID,
    order: 12,
    predefinedContentRef: {
      failureScenario: "The student reinvents common solutions — custom event dispatch, ad-hoc object factories, nested observers — without recognising that well-known, documented design patterns solve these exact problems. When code becomes hard to maintain, they add more ad-hoc complexity rather than reaching for a pattern that communicates intent to other engineers.",
      teachingObjective: "Identify the problem that each major design pattern addresses. Implement the Singleton, Factory Method, Builder, Strategy, Observer, and Decorator patterns in Java. Recognise pattern use in existing frameworks (e.g. Spring uses Factory, Template Method, Proxy, and Observer extensively). Prefer named patterns over ad-hoc duplication.",
      coreContent: "Design patterns are reusable solutions to recurring design problems, catalogued by the Gang of Four (Gamma, Helm, Johnson, Vlissides) in 1994. Creational patterns manage object creation: Singleton ensures one instance; Factory Method defers instantiation to subclasses; Builder separates complex construction from representation. Structural patterns organise relationships: Decorator adds behaviour without subclassing; Proxy controls access; Adapter bridges incompatible interfaces; Composite treats single objects and groups uniformly. Behavioural patterns manage communication: Strategy encapsulates interchangeable algorithms; Observer decouples event producers from consumers; Template Method defines the skeleton of an algorithm, deferring steps to subclasses; Command encapsulates a request as an object. Using a named pattern communicates design intent immediately to anyone who recognises it."
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILDER — Backend engineering with Spring Boot
  // ═══════════════════════════════════════════════════════════════════════════

  {
    _id: UUID("40000000-1000-1000-1000-000000000001"),
    stageId: BUILDER_ID,
    order: 1,
    predefinedContentRef: {
      failureScenario: "The student starts a Spring Boot project but is paralysed by the volume of auto-configuration magic. They do not understand how beans are created, what the application context is, or why annotating a class with `@Service` makes it injectable elsewhere. Configuration errors produce cryptic startup failures they cannot diagnose.",
      teachingObjective: "Bootstrap a Spring Boot application from scratch. Explain the role of the application context, bean lifecycle, and dependency injection. Configure properties via `application.properties`. Diagnose startup failures using auto-configuration reports and the startup log.",
      coreContent: "Spring Boot is an opinionated framework that auto-configures Spring components based on classpath dependencies and properties. The application context is a container that manages beans (Spring-managed objects) and their dependencies. Stereotype annotations declare beans: `@Component` (generic), `@Service` (business logic), `@Repository` (data access), `@Controller`/`@RestController` (HTTP layer). Constructor injection is preferred over field injection for testability and immutability. `@SpringBootApplication` combines `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. `application.properties` provides environment-specific configuration; `@Value` injects individual properties and `@ConfigurationProperties` binds a prefix to a class. The auto-configuration report (enable with `--debug`) lists what was and was not configured and why."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000002"),
    stageId: BUILDER_ID,
    order: 2,
    predefinedContentRef: {
      failureScenario: "The student exposes business objects directly as JSON, uses `GET` for operations that mutate state, returns 200 for every response regardless of outcome, and places all logic in a single controller method. Their API is unpredictable, hard to version, and cannot be consumed without reading the source code.",
      teachingObjective: "Design a RESTful HTTP API that correctly uses HTTP verbs, status codes, and resource-oriented URL structures. Implement CRUD endpoints with `@RestController`, `@RequestMapping`, `@PathVariable`, and `@RequestBody`. Return `ResponseEntity` with appropriate status codes. Separate API concerns (request/response DTOs) from domain models.",
      coreContent: "REST (Representational State Transfer) is an architectural style for distributed hypermedia systems. Core constraints: statelessness (each request contains all information needed to process it), uniform interface (standard HTTP verbs and status codes), resource identification via URI. HTTP verbs: GET retrieves, POST creates, PUT replaces, PATCH partially updates, DELETE removes. Status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorised, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 500 Internal Server Error. Use nouns in URLs (`/customers/42/orders`) not verbs (`/getCustomerOrders`). DTOs (Data Transfer Objects) decouple the API contract from the domain model, preventing accidental exposure of internal fields and allowing the API to evolve independently."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000003"),
    stageId: BUILDER_ID,
    order: 3,
    predefinedContentRef: {
      failureScenario: "The student accepts request bodies without validating them, trusting callers to send correct data. Negative prices, empty required fields, and malformed email addresses all reach the database. When persistence fails due to constraint violations, the database error propagates to the caller as a 500 rather than a 400.",
      teachingObjective: "Apply Bean Validation annotations (`@NotNull`, `@NotBlank`, `@Min`, `@Max`, `@Email`, `@Pattern`) to request DTOs. Trigger validation with `@Valid` on controller parameters. Handle `MethodArgumentNotValidException` globally in a `@ControllerAdvice` to return structured 400 responses. Write a custom constraint annotation for domain-specific rules.",
      coreContent: "Input validation defends the service against malformed or malicious input at the boundary. Spring Boot integrates Jakarta Bean Validation (Hibernate Validator implementation). Annotate request DTO fields with constraints: `@NotNull` (not null), `@NotBlank` (non-null, non-empty, non-whitespace string), `@Size(min, max)`, `@Min(value)`, `@Max(value)`, `@Email`, `@Pattern(regexp)`, `@Positive`, `@PositiveOrZero`. Add `@Valid` to the controller parameter to activate validation. A failed validation throws `MethodArgumentNotValidException`; handle it in a `@RestControllerAdvice` class implementing `@ExceptionHandler` to produce a consistent error envelope. `@ControllerAdvice` (or `@RestControllerAdvice`) is Spring's mechanism for cross-cutting exception handling across all controllers. Global exception handlers prevent implementation details from leaking into error responses."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000004"),
    stageId: BUILDER_ID,
    order: 4,
    predefinedContentRef: {
      failureScenario: "The student's API is entirely open — no authentication, no authorisation. Adding security is an afterthought; they are unsure whether to put auth logic in each controller, a servlet filter, or a separate service. When asked to restrict endpoints to authenticated users only, they do not know where to start.",
      teachingObjective: "Configure Spring Security to require authentication on protected endpoints while leaving public endpoints open. Understand the security filter chain and where authentication and authorisation decisions are made. Apply `@PreAuthorize` for method-level security. Describe the difference between authentication (who are you?) and authorisation (what are you allowed to do?).",
      coreContent: "Spring Security is a framework that hooks into the servlet filter chain to intercept every HTTP request before it reaches the controller. The `SecurityFilterChain` bean configures which endpoints require authentication, which HTTP methods are permitted, and which filter applies authentication. CSRF protection is enabled by default for state-changing requests; disable for stateless REST APIs that use token-based auth. Authentication is the process of verifying identity (username/password, token, certificate); authorisation is the process of verifying that the authenticated identity has permission to perform the requested action. `UserDetailsService` loads user data by username; `PasswordEncoder` hashes and verifies passwords. `@PreAuthorize(\"hasRole('ADMIN')\")` provides method-level authorisation using Spring Security expressions. Always prefer deny-by-default: explicitly permit what is allowed and block everything else."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000005"),
    stageId: BUILDER_ID,
    order: 5,
    predefinedContentRef: {
      failureScenario: "The student stores passwords in plain text, uses a symmetric key shared across all users as an auth token, or embeds user state in the token without verifying it server-side. Their token does not expire, is transmitted in a URL parameter, and is stored in `localStorage` where a script can steal it.",
      teachingObjective: "Implement stateless JWT-based authentication: issue a signed access token on login, validate the token on each request, and refresh it via a long-lived refresh token. Understand the structure of a JWT (header, payload, signature). Store tokens securely on the client. Implement token rotation to detect refresh token theft.",
      coreContent: "JSON Web Token (JWT) is a compact, URL-safe token format. A JWT has three Base64URL-encoded sections separated by `.`: header (algorithm and type), payload (claims: sub, iat, exp, and custom fields), and signature. The server signs the token with a secret or private key; the receiver verifies the signature before trusting the payload. Access tokens are short-lived (minutes to hours) and sent in the `Authorization: Bearer <token>` header. Refresh tokens are long-lived and stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie to prevent XSS theft. On access token expiry, the client exchanges the refresh token for a new access token; the server rotates the refresh token (issues a new one and invalidates the old) to detect replay attacks. Never store sensitive data in the JWT payload; it is Base64-encoded, not encrypted."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000006"),
    stageId: BUILDER_ID,
    order: 6,
    predefinedContentRef: {
      failureScenario: "The student writes SQL with string concatenation, exposing the application to SQL injection. They do not understand indexes, run a `SELECT *` with a LIKE scan on an unindexed column for every request, and do not know how to design a normalised schema or interpret an `EXPLAIN` output.",
      teachingObjective: "Design a normalised relational schema in PostgreSQL. Write safe parameterised queries. Use `EXPLAIN ANALYSE` to identify missing indexes. Create indexes on high-cardinality filter and join columns. Understand the trade-offs of normalisation and denormalisation.",
      coreContent: "PostgreSQL is a powerful open-source relational database. Relational databases model data as tables (relations) with columns (attributes) and rows (tuples). Normalisation reduces redundancy: 1NF eliminates repeating groups; 2NF eliminates partial dependencies; 3NF eliminates transitive dependencies. Primary keys uniquely identify rows; foreign keys enforce referential integrity. SQL is the query language: SELECT, INSERT, UPDATE, DELETE, JOIN (INNER, LEFT, RIGHT, FULL), GROUP BY, HAVING, ORDER BY. Parameterised queries (prepared statements) prevent SQL injection by separating code from data. Indexes speed up read queries by maintaining a sorted data structure on the indexed column; they slow writes and consume storage. `EXPLAIN ANALYSE` shows the query plan and actual execution times, revealing sequential scans that should be index scans. Common performance pitfalls: `SELECT *` over wide rows, correlated subqueries, and missing indexes on JOIN columns."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000007"),
    stageId: BUILDER_ID,
    order: 7,
    predefinedContentRef: {
      failureScenario: "The student writes raw SQL strings in Java code, does not use connection pooling, and reinvents CRUD operations that Spring Data JPA provides automatically. When querying, they load entire object graphs into memory when only one column is needed, and they are not aware of the N+1 query problem.",
      teachingObjective: "Map domain entities to database tables using JPA annotations. Write repositories using Spring Data JPA's `JpaRepository`. Implement custom JPQL and native queries. Fetch only the data needed using projections. Diagnose and resolve the N+1 query problem with `JOIN FETCH` or `@EntityGraph`.",
      coreContent: "The Jakarta Persistence API (JPA) is the standard Java ORM (Object-Relational Mapping) specification; Hibernate is the reference implementation used by Spring Data JPA. `@Entity` marks a class as a JPA entity; `@Id` marks the primary key; `@GeneratedValue` configures auto-increment. `@OneToMany`, `@ManyToOne`, `@ManyToMany` define relationships; the `fetch` attribute controls whether related entities are loaded eagerly (immediately) or lazily (on access). Spring Data JPA generates the CRUD implementation from a `JpaRepository<Entity, ID>` interface; derived query methods like `findByEmailAndActive(email, true)` are parsed to SQL automatically. The N+1 problem occurs when loading N parent records triggers N additional queries for related records; solve with `JOIN FETCH` in JPQL or `@EntityGraph`. Use projections (interfaces or DTOs as return types) to select only needed columns."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000008"),
    stageId: BUILDER_ID,
    order: 8,
    predefinedContentRef: {
      failureScenario: "The student calls multiple database operations without wrapping them in a transaction. When the second operation fails, the first is already committed, leaving the database in an inconsistent state. They apply `@Transactional` without understanding propagation or isolation, or they place it on a `private` method where it has no effect.",
      teachingObjective: "Identify operations that must be atomic and wrap them in a transaction using Spring's `@Transactional`. Explain ACID properties and their implications. Select the appropriate isolation level for a given use case. Diagnose and resolve deadlocks and optimistic locking conflicts.",
      coreContent: "A database transaction is a unit of work that satisfies the ACID properties: Atomicity (all operations succeed or all are rolled back), Consistency (the transaction moves the database from one valid state to another), Isolation (concurrent transactions do not see each other's uncommitted changes), Durability (committed changes persist despite failures). Spring's `@Transactional` intercepts method calls via a proxy and begins/commits/rolls back the database transaction. It must be applied to `public` methods on Spring-managed beans; calling a `@Transactional` method from within the same class bypasses the proxy. Propagation controls what happens when a transactional method calls another: `REQUIRED` (join or create), `REQUIRES_NEW` (always create a new transaction). Isolation levels: READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE — each trades correctness for concurrency. Optimistic locking (`@Version`) detects concurrent modification by incrementing a version column; a stale update throws `OptimisticLockException`."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000009"),
    stageId: BUILDER_ID,
    order: 9,
    predefinedContentRef: {
      failureScenario: "The student's application works on their laptop but fails on a colleague's machine due to different JDK versions, missing environment variables, and operating system differences. They have no reproducible way to run the full stack including the database, and deployment to a server requires manual steps that are not documented.",
      teachingObjective: "Package a Spring Boot application as a Docker image. Write a production-quality `Dockerfile` using a multi-stage build. Define a `docker-compose.yml` that runs the application, database, and cache together. Understand how Docker networking, volumes, and environment variable injection work.",
      coreContent: "Docker packages an application and its dependencies into a portable container image that runs identically on any machine with the Docker Engine. A `Dockerfile` specifies how to build the image: `FROM` selects the base image; `COPY` copies files; `RUN` executes commands; `EXPOSE` documents the port; `ENTRYPOINT` specifies the command to run. A multi-stage build uses multiple `FROM` statements: the first stage compiles the application (requiring a JDK), and the second stage copies only the compiled artefact into a minimal JRE image, reducing the final image size. `docker-compose.yml` describes a multi-container application: services (app, db, cache), their images, port mappings, environment variables, volume mounts, and startup dependencies (`depends_on`). Docker networking assigns each service a hostname equal to its service name, enabling `app` to reach `db` at `jdbc:postgresql://db:5432/mergedb`. Volumes persist database data across container restarts."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000010"),
    stageId: BUILDER_ID,
    order: 10,
    predefinedContentRef: {
      failureScenario: "The student's tests mock every dependency so completely that the tests pass even when the integration points are broken. They do not know how to test a Spring MVC controller without starting a full server, or how to test a JPA repository against a real database.",
      teachingObjective: "Write integration tests using `@SpringBootTest`, `MockMvc`, and Testcontainers. Test the full HTTP layer without starting a real server. Assert database state after a write operation. Use `@Transactional` on tests to roll back between test methods. Distinguish unit, integration, and end-to-end tests and know when to use each.",
      coreContent: "An integration test exercises multiple layers of the stack together, unlike a unit test that isolates a single class. Spring Boot Test provides `@SpringBootTest` which loads the full application context; use `webEnvironment = MOCK` for MockMvc-based controller tests without a real server, or `webEnvironment = RANDOM_PORT` for tests against a real HTTP stack. `MockMvc` sends HTTP requests and asserts responses without network overhead: `mockMvc.perform(post(\"/api/orders\").content(json)).andExpect(status().isCreated())`. Testcontainers starts a real Docker container (e.g. PostgreSQL) during the test and shuts it down after; this gives tests a real database without infrastructure assumptions. `@Transactional` on a test class wraps each test method in a transaction that is automatically rolled back, leaving the database clean for the next test. The test pyramid: many unit tests, fewer integration tests, fewest end-to-end tests."
    }
  },

  {
    _id: UUID("40000000-1000-1000-1000-000000000011"),
    stageId: BUILDER_ID,
    order: 11,
    predefinedContentRef: {
      failureScenario: "The student deploys by SSH-ing into a server, copying a JAR, and hoping no one notices the downtime. There is no automated build, no test run in CI, and no way to roll back a bad deployment. Colleagues cannot merge code confidently because there is no gate preventing broken builds from reaching production.",
      teachingObjective: "Configure a CI pipeline (GitHub Actions) that builds the application, runs the full test suite, and produces a Docker image on every push to `main`. Implement a deployment workflow that pushes the image to a registry and deploys it. Understand the difference between continuous integration, continuous delivery, and continuous deployment.",
      coreContent: "Continuous Integration (CI) is the practice of merging code changes frequently into a shared branch and verifying each change with an automated build and test run. Continuous Delivery (CD) extends CI by automatically packaging the verified build and making it ready for deployment; Continuous Deployment takes it further by automatically deploying every verified build to production. GitHub Actions defines workflows in YAML files under `.github/workflows/`. A workflow has triggers (push, pull_request), jobs (groups of steps), and steps (individual commands). A CI workflow typically: checks out the code, sets up the JDK, runs `mvn verify` (builds and runs tests), builds a Docker image, and pushes it to a registry (Docker Hub, GHCR). Environment variables and secrets are injected securely via repository settings. A deployment job runs after CI passes, pulling the new image and restarting the service on the target environment."
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINEER — Distributed systems at scale
  // ═══════════════════════════════════════════════════════════════════════════

  {
    _id: UUID("50000000-1000-1000-1000-000000000001"),
    stageId: ENGINEER_ID,
    order: 1,
    predefinedContentRef: {
      failureScenario: "The student is asked to design a URL shortener or rate limiter and immediately proposes a complex microservices architecture with event sourcing and a global CDN, without first understanding the scale requirements, read/write ratio, or consistency needs. They add complexity as a substitute for analysis.",
      teachingObjective: "Approach a system design problem with structured analysis: clarify requirements, estimate scale, identify bottlenecks, and select components that match actual constraints. Draw a component diagram. Reason about trade-offs: latency versus consistency, simplicity versus scalability, cost versus reliability.",
      coreContent: "System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements. A structured approach: (1) Clarify functional and non-functional requirements — QPS, data volume, latency SLA, availability target. (2) Estimate capacity — storage, bandwidth, request rate. (3) Define the high-level design — clients, load balancers, application servers, databases, caches, message queues. (4) Deep-dive into critical components. (5) Identify failure modes and mitigations. Key trade-offs: vertical versus horizontal scaling; SQL versus NoSQL; strong versus eventual consistency; synchronous versus asynchronous communication; monolith versus microservices. The CAP theorem states that a distributed system can satisfy at most two of Consistency, Availability, and Partition tolerance; in practice, network partitions occur, so the real choice is CP versus AP."
    }
  },

  {
    _id: UUID("50000000-1000-1000-1000-000000000002"),
    stageId: ENGINEER_ID,
    order: 2,
    predefinedContentRef: {
      failureScenario: "The student assumes distributed systems behave like local systems — that network calls are reliable and instant, that clocks on different machines are synchronised, and that a write to one node is immediately visible to all nodes. Their service fails silently when a downstream dependency is unavailable.",
      teachingObjective: "Apply the eight fallacies of distributed computing to identify assumptions that break in production. Design services that handle partial failures gracefully using timeouts, retries with exponential backoff, circuit breakers, and bulkheads. Reason about consistency models: strong, causal, and eventual consistency.",
      coreContent: "The eight fallacies of distributed computing (attributed to Peter Deutsch): the network is reliable; latency is zero; bandwidth is infinite; the network is secure; topology does not change; there is one administrator; transport cost is zero; the network is homogeneous. Every distributed system must be designed assuming these are false. Partial failure — where some components fail while others continue — is the norm. Techniques for resilience: timeouts prevent indefinite blocking; retries with jitter avoid thundering herds; circuit breakers (Resilience4j, Hystrix) stop sending requests to a failing service; bulkheads isolate failures by limiting concurrent calls per dependency. Consistency models: strong consistency guarantees that a read always returns the most recent write; eventual consistency allows stale reads but guarantees that all replicas converge; causal consistency guarantees that causally related operations are seen in the correct order by all nodes. The PACELC theorem extends CAP: even without partitions, there is a trade-off between latency and consistency."
    }
  },

  {
    _id: UUID("50000000-1000-1000-1000-000000000003"),
    stageId: ENGINEER_ID,
    order: 3,
    predefinedContentRef: {
      failureScenario: "The student's service writes directly to the downstream service in the request-response path. When the downstream service is slow, every upstream request blocks and the whole system degrades. They do not understand how to decouple producers from consumers or how to handle back-pressure.",
      teachingObjective: "Design event-driven communication between services using Apache Kafka. Produce and consume messages with correct partition assignment, consumer group semantics, and at-least-once delivery guarantees. Handle out-of-order and duplicate messages idempotently. Monitor consumer lag.",
      coreContent: "Apache Kafka is a distributed event-streaming platform. Core concepts: a topic is a named, ordered, durable log of records; it is partitioned for parallelism and replicated for durability. A producer appends records to a topic partition; a consumer reads records from a partition at its own pace, tracked by an offset. A consumer group allows multiple consumers to collectively read a topic — each partition is assigned to exactly one consumer in the group at a time, giving horizontal read scalability. Kafka provides at-least-once delivery by default: on failure, the consumer re-reads from the last committed offset and may re-process records. Idempotent consumers handle duplicates: check for a unique event ID before processing. A log retention policy deletes records older than a configured time or when the log reaches a size limit. Spring Kafka simplifies producer and consumer configuration; `@KafkaListener` annotates consumer methods. Consumer lag (the difference between the latest offset and the committed offset) is the key operational metric."
    }
  },

  {
    _id: UUID("50000000-1000-1000-1000-000000000004"),
    stageId: ENGINEER_ID,
    order: 4,
    predefinedContentRef: {
      failureScenario: "The student queries the database on every request without caching, causing the database to become the bottleneck under load. Their cache strategy results in stale data being served indefinitely, and cache stampedes (many cache misses simultaneously refilling the cache) periodically spike database load.",
      teachingObjective: "Implement a cache-aside pattern in Spring using Redis. Set appropriate TTLs and handle cache invalidation on writes. Implement a rate limiter using Redis atomic operations. Explain the cache-aside, write-through, and write-behind patterns and their consistency trade-offs.",
      coreContent: "Redis is an in-memory data structure store used as a cache, message broker, and rate limiter. Core data types: String, List, Hash, Set, Sorted Set, and Stream. Cache patterns: cache-aside (the application checks the cache, reads from the database on miss, writes to the cache) is the most common and gives the application explicit control; write-through (write to cache and database together) keeps the cache consistent but adds write latency; write-behind (write to cache, asynchronously write to database) improves write throughput but risks data loss. TTL (Time To Live) controls staleness: short TTL reduces staleness but increases database load; long TTL reduces load but risks serving outdated data. Cache stampede (thundering herd) occurs when many requests simultaneously miss a cache entry and hit the database; mitigate with probabilistic early expiration or a lock that prevents concurrent refills. Spring Data Redis provides `@Cacheable`, `@CachePut`, and `@CacheEvict` annotations for declarative caching."
    }
  },

  {
    _id: UUID("50000000-1000-1000-1000-000000000005"),
    stageId: ENGINEER_ID,
    order: 5,
    predefinedContentRef: {
      failureScenario: "The student's service runs on a single server that is overwhelmed under load. They believe adding more RAM or CPU to the same server is the only way to handle more traffic. They cannot describe how a load balancer distributes requests or what state management challenges arise when multiple instances share traffic.",
      teachingObjective: "Design stateless services that can be horizontally scaled by running multiple identical instances behind a load balancer. Explain round-robin, least-connections, and consistent-hashing load balancing. Identify state that prevents horizontal scaling (sticky sessions, in-memory cache, local file system) and move it to shared infrastructure.",
      coreContent: "Horizontal scaling adds more instances of a service to handle more load; vertical scaling adds more resources (CPU, RAM) to the existing instance. Horizontal scaling is cheaper at scale, more fault-tolerant (individual instance failure does not affect availability), and has no theoretical upper limit — but services must be stateless to scale horizontally. Stateless services store all state in external systems (database, cache, object storage); any instance can handle any request. Load balancers distribute requests across instances: round-robin cycles through instances evenly; least-connections routes to the instance with the fewest active connections; consistent hashing maps each request key to a specific instance, reducing cache invalidation on instance changes. Session state must be externalised to a shared store (Redis) rather than held in-memory on the application instance. Blue-green deployment runs two identical production environments and switches traffic atomically, enabling zero-downtime releases and instant rollback."
    }
  },

  {
    _id: UUID("50000000-1000-1000-1000-000000000006"),
    stageId: ENGINEER_ID,
    order: 6,
    predefinedContentRef: {
      failureScenario: "The student deploys containerised services manually by SSH-ing into servers and running `docker run` commands. They do not know how to handle service discovery, rolling updates, or automatic restarts when a container crashes. Their deployment process is manual, error-prone, and does not scale to dozens of services.",
      teachingObjective: "Deploy and operate a containerised application on Kubernetes. Write a `Deployment` manifest and a `Service` manifest. Perform a rolling update and roll back on failure. Configure liveness and readiness probes. Understand how the control plane, nodes, pods, and the kubelet relate.",
      coreContent: "Kubernetes (K8s) is an open-source container orchestration system. Core concepts: a Pod is the smallest deployable unit — one or more containers sharing a network namespace; a Deployment manages a desired state for a set of Pods, handling rolling updates and self-healing; a Service provides a stable network endpoint for a dynamic set of Pods, using label selectors; a ConfigMap holds non-sensitive configuration; a Secret holds sensitive configuration. The control plane (API server, scheduler, etcd, controller manager) manages cluster state; nodes (worker machines) run the kubelet, which manages pod lifecycle, and kube-proxy, which manages network rules. Liveness probes restart a container that has entered a bad state; readiness probes prevent traffic from reaching a container until it is ready to serve. A `HorizontalPodAutoscaler` scales the number of pods based on CPU or custom metrics. Rolling updates replace pods gradually, maintaining availability; `maxUnavailable` and `maxSurge` control the rollout speed."
    }
  },

  {
    _id: UUID("50000000-1000-1000-1000-000000000007"),
    stageId: ENGINEER_ID,
    order: 7,
    predefinedContentRef: {
      failureScenario: "The student's service degrades silently in production. Users report slowness, but the team has no dashboards, no alerting, no distributed traces, and no structured logs. They spend hours SSH-ing through logs on multiple servers trying to reconstruct what happened, without knowing which service caused the problem.",
      teachingObjective: "Implement the three pillars of observability: structured logging with correlation IDs, metrics exported to Prometheus and visualised in Grafana, and distributed tracing with OpenTelemetry. Define meaningful SLIs, SLOs, and error budgets. Set up alerting that pages on SLO breaches rather than on raw metrics.",
      coreContent: "Observability is the ability to understand a system's internal state from its external outputs. The three pillars: Logs — structured (JSON) log records with timestamp, level, service name, trace ID, and message; use a correlation ID (trace ID) to link logs across services for a single request. Metrics — numerical measurements over time (request rate, error rate, latency percentiles p50/p95/p99); expose via Micrometer in Spring Boot, scrape with Prometheus, visualise in Grafana. Traces — a distributed trace records the path of a request through multiple services; each unit of work is a span; spans are linked by trace ID and span ID. SLI (Service Level Indicator) is a quantitative measure of service level (e.g. 99th-percentile latency). SLO (Service Level Objective) is the target value for an SLI (e.g. p99 < 200 ms for 99.9% of the time). Error budget is the allowed degradation before the SLO is breached. Alert on SLO burn rate, not on individual metric thresholds."
    }
  },

  {
    _id: UUID("50000000-1000-1000-1000-000000000008"),
    stageId: ENGINEER_ID,
    order: 8,
    predefinedContentRef: {
      failureScenario: "The student's service is slow in production but fast in development. They add indexes at random without measuring, add an in-memory cache that is never hit, and run load tests that do not reflect production traffic patterns. They cannot identify whether the bottleneck is CPU, I/O, network, or a slow database query.",
      teachingObjective: "Profile a JVM application to identify CPU and memory bottlenecks. Analyse slow database queries with `EXPLAIN ANALYSE`. Measure throughput and latency under load with JMH or k6. Apply the USE method (Utilisation, Saturation, Errors) to identify the resource that is the bottleneck.",
      coreContent: "Performance engineering is the practice of making systems fast, efficient, and reliable under load. The USE method (Brendan Gregg): for each resource (CPU, memory, network I/O, disk I/O), measure Utilisation (% busy), Saturation (queue depth), and Errors. The resource with the highest utilisation or saturation is the bottleneck. JVM profiling: async-profiler samples stack traces at a high frequency to produce a flame graph — the widest bars indicate where CPU time is being spent. Heap profiling identifies allocation hotspots and objects that survive garbage collection longer than expected. Database: `EXPLAIN ANALYSE` shows the actual query plan including row counts and timing at each node; sequential scans on large tables indicate missing indexes. JMH (Java Microbenchmark Harness) measures the throughput of a single method, isolated from JIT warm-up noise. k6 or Gatling simulate realistic HTTP load to measure system-level throughput, latency, and error rate. Always establish a performance baseline before optimising."
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHITECT — Strategic design and technical leadership
  // ═══════════════════════════════════════════════════════════════════════════

  {
    _id: UUID("60000000-1000-1000-1000-000000000001"),
    stageId: ARCHITECT_ID,
    order: 1,
    predefinedContentRef: {
      failureScenario: "The student's codebase has no clear domain model. Business logic is scattered across service classes, HTTP controllers, and database repositories. When the business rules change, every layer needs to be modified. The codebase cannot be tested without standing up the entire infrastructure stack.",
      teachingObjective: "Model a complex business domain using DDD building blocks: Entities, Value Objects, Aggregates, Domain Events, Repositories, and Domain Services. Place business invariants inside Aggregates. Separate domain logic from infrastructure concerns using a ports-and-adapters (hexagonal) architecture. Identify bounded contexts and define context maps.",
      coreContent: "Domain-Driven Design (Evans, 2003) is an approach to software development that centres the design around a rich domain model that reflects the business. A Domain Model captures the vocabulary, rules, and logic of a specific area of the business. Entities have identity that persists across state changes; Value Objects are defined by their attributes and are immutable. Aggregates are clusters of entities and value objects that are modified as a unit; the Aggregate Root is the only entry point and enforces all invariants. Repositories abstract data access — the domain layer calls repository interfaces; the infrastructure layer provides the implementation. Domain Events signal that something significant happened in the domain; they decouple aggregates from side effects. A Bounded Context is the explicit boundary within which a domain model applies; outside it, the same terms may have different meanings. Context Mapping patterns (Shared Kernel, Conformist, Anti-Corruption Layer, Open-Host Service) describe how bounded contexts integrate."
    }
  },

  {
    _id: UUID("60000000-1000-1000-1000-000000000002"),
    stageId: ARCHITECT_ID,
    order: 2,
    predefinedContentRef: {
      failureScenario: "The student uses the same data model for writes (commands) and reads (queries). Complex reporting queries with many JOINs compete with write operations on the same tables, degrading write throughput. Adding a new read requirement requires schema changes that affect write performance.",
      teachingObjective: "Apply the CQRS pattern to separate the write model (command side) from the read model (query side). Implement a command handler that validates commands and applies them to aggregates. Maintain a denormalised read model (projection) optimised for queries. Explain when CQRS adds value and when it adds unnecessary complexity.",
      coreContent: "Command Query Responsibility Segregation (CQRS) separates the write model (commands that mutate state) from the read model (queries that return data). The write side processes commands: validates the command, loads the aggregate from the repository, applies the command to the aggregate (which may emit domain events), and saves the updated aggregate. The read side maintains one or more denormalised projections, built by consuming domain events; each projection is optimised for a specific query pattern (e.g. a flat document for a list view, a pre-computed aggregate for a dashboard). CQRS allows the read and write sides to scale independently and use different storage technologies (relational for writes, document or search index for reads). The trade-off is eventual consistency between the write model and the read projections. CQRS is not appropriate for simple CRUD applications; the added complexity pays off only when query and write requirements diverge significantly."
    }
  },

  {
    _id: UUID("60000000-1000-1000-1000-000000000003"),
    stageId: ARCHITECT_ID,
    order: 3,
    predefinedContentRef: {
      failureScenario: "The student stores only the current state of an entity. When a business analyst asks 'what was the account balance on a specific date?' or 'who changed this record and when?', there is no answer. Auditing is a logging afterthought that is incomplete and disconnected from the business model.",
      teachingObjective: "Implement an event-sourced aggregate that persists its state as an append-only sequence of domain events. Rebuild current state by replaying the event log. Build a time-travel query: reconstruct the state at any past point in time. Explain the trade-offs of event sourcing versus state-based persistence.",
      coreContent: "Event Sourcing stores the state of an aggregate as an ordered, immutable log of domain events rather than as a snapshot of the current state. An event represents something that happened: `OrderPlaced`, `ItemAdded`, `OrderShipped`. Current state is derived by replaying the event log from the beginning (or from a snapshot). Benefits: a complete audit log is free; temporal queries (state at any past point) are trivial; the event log is the source of truth for rebuilding projections after bugs are fixed; events can be published to message brokers for integration. Challenges: replaying a large event stream is slow (mitigated by periodic snapshots); evolving event schemas requires a migration strategy (upcasters); querying current state requires a read model. Snapshots periodically capture the current state to avoid full replays; the system replays from the latest snapshot plus subsequent events. Event sourcing pairs naturally with CQRS because the event stream drives the read model projections."
    }
  },

  {
    _id: UUID("60000000-1000-1000-1000-000000000004"),
    stageId: ARCHITECT_ID,
    order: 4,
    predefinedContentRef: {
      failureScenario: "The student's organisation has dozens of teams each setting up their own CI pipelines, Kubernetes clusters, observability stacks, and security policies from scratch. Engineers spend more time on infrastructure than on product features. Practices vary widely, making it hard to move engineers between teams.",
      teachingObjective: "Design an Internal Developer Platform that abstracts infrastructure complexity behind self-service workflows. Identify the capabilities a platform should provide (golden paths, deployment pipelines, environment provisioning, observability). Apply the Team Topologies model to structure the platform team's relationship with stream-aligned teams.",
      coreContent: "Platform Engineering is the discipline of designing and building self-service internal developer platforms that enable product engineering teams to deliver software efficiently and safely. An Internal Developer Platform (IDP) provides: golden paths (opinionated, pre-built solutions for common use cases), self-service environment provisioning, automated CI/CD pipelines, standardised observability, secrets management, and policy enforcement. The CNCF platform maturity model describes four levels: for individual teams, for multiple teams, for organisations, and optimising. Team Topologies (Skelton and Pais) categorises teams as Stream-Aligned (focus on delivering a product domain), Enabling (help stream-aligned teams adopt new capabilities), Complicated-Subsystem (manage high-complexity components), and Platform (provide internal products that reduce cognitive load). A platform team's measure of success is the reduction in toil and time-to-deploy for stream-aligned teams. Backstage is an open-source IDP framework that provides a service catalogue, TechDocs, and a plugin ecosystem."
    }
  },

  {
    _id: UUID("60000000-1000-1000-1000-000000000005"),
    stageId: ARCHITECT_ID,
    order: 5,
    predefinedContentRef: {
      failureScenario: "The student recommends microservices for every project without analysing whether the team size, domain complexity, or deployment frequency justify the operational overhead. Alternatively, they dismiss all architectural patterns as unnecessary complexity and produce a monolith that becomes unmaintainable as the team grows.",
      teachingObjective: "Evaluate multiple architectural styles — layered monolith, modular monolith, microservices, event-driven, hexagonal — against a set of real requirements and constraints. Document the chosen architecture using Architecture Decision Records (ADRs). Reason about fitness functions that verify architectural constraints automatically.",
      coreContent: "Architecture is the set of significant decisions that shape a system's structure, behaviour, and quality attributes. Architectural styles: Layered monolith — simple to build and operate; becomes a big ball of mud as teams scale. Modular monolith — a monolith partitioned into strongly-decoupled modules with explicit public APIs; reduces inter-team coupling without the operational overhead of microservices. Microservices — independently deployable services with separate data stores; enables per-service scaling and independent deployment at the cost of distributed systems complexity. Event-driven — services communicate asynchronously via events; decouples producers from consumers but introduces eventual consistency. Hexagonal (ports and adapters) — the core domain is isolated from infrastructure by ports (interfaces) and adapters (implementations); applicable at any scale. Architecture Decision Records (ADRs) document the context, decision, and consequences of a significant architectural choice; they are version-controlled alongside the code. Fitness functions (Building Evolutionary Architectures, Ford et al.) are automated tests that verify architectural properties: import cycles, layer violations, test coverage thresholds."
    }
  },

  {
    _id: UUID("60000000-1000-1000-1000-000000000006"),
    stageId: ARCHITECT_ID,
    order: 6,
    predefinedContentRef: {
      failureScenario: "The student is technically excellent but ineffective in a staff or principal engineer role. They do not produce RFCs, cannot give actionable technical feedback in code review, underestimate the impact of communication and documentation, and struggle to influence decisions in cross-team settings without formal authority.",
      teachingObjective: "Produce a technical RFC (Request for Comments) that clearly states the problem, alternatives considered, the proposed solution, and its consequences. Give code review feedback that is specific, actionable, and respectful. Influence a cross-team technical decision without formal authority by building credibility through evidence and stakeholder relationships.",
      coreContent: "Technical leadership at the staff and principal level operates through influence rather than authority. An RFC (Request for Comments) is a structured document that proposes a technical solution, invites input before a decision is made, and creates a durable record of the decision. A well-structured RFC: defines the problem clearly, lists the constraints, enumerates alternatives with their trade-offs, proposes a solution with rationale, and lists consequences (positive and negative). Code review is a primary leadership tool: feedback should identify the specific issue, explain why it matters, suggest an improvement, and distinguish must-fix from optional. Influence without authority requires: understanding stakeholders' priorities, framing proposals in terms of their goals, building credibility through a track record of sound judgement, listening actively, and identifying and engaging key decision-makers early. Will Larson's Staff Engineer describes four archetypes: Tech Lead, Architect, Solver, and Right Hand."
    }
  },

  {
    _id: UUID("60000000-1000-1000-1000-000000000007"),
    stageId: ARCHITECT_ID,
    order: 7,
    predefinedContentRef: {
      failureScenario: "The student's services have no availability targets and no defined error budgets. When an outage occurs, the post-mortem identifies symptoms rather than root causes, assigns blame, and produces a long list of action items that are never prioritised or completed. The same class of failure recurs.",
      teachingObjective: "Define and measure availability using SLIs and SLOs. Maintain an error budget and use it to gate feature work. Run a blameless post-mortem that identifies systemic contributing factors and produces a prioritised set of action items. Design for reliability using chaos engineering and failure mode analysis.",
      coreContent: "Site Reliability Engineering (SRE), developed at Google, applies software engineering principles to operations. SLI (Service Level Indicator): a carefully chosen quantitative measure of service level, e.g. proportion of HTTP requests completing in under 200 ms. SLO (Service Level Objective): a target value for the SLI, e.g. 99.9% of requests complete in under 200 ms over a 28-day window. Error budget: 100% minus the SLO; the allowed amount of unreliability. When the error budget is consumed, reliability work takes priority over feature work. Toil is manual, repetitive, automatable operational work that scales linearly with service growth; SRE aims to keep toil below 50% of each engineer's time. A blameless post-mortem identifies the contributing factors to an incident — not who made a mistake but why the system allowed the mistake to have impact — and produces a ranked action item list with owners and deadlines. Chaos engineering (Chaos Monkey, Gremlin) injects failures in production (or staging) to validate that the system handles them gracefully and to identify previously unknown failure modes."
    }
  }
];

// ─── Upsert all concepts ─────────────────────────────────────────────────────
let seeded = 0;
concepts.forEach(c => {
  db.concepts.updateOne(
    { _id: c._id },
    {
      $set: {
        stageId: c.stageId,
        order: c.order,
        predefinedContentRef: c.predefinedContentRef
      }
    },
    { upsert: true }
  );
  seeded++;
});

print(`✓ ${seeded} concepts seeded`);
print(`  Scout: 15 | Cadet: 12 | Builder: 11 | Engineer: 8 | Architect: 7`);
