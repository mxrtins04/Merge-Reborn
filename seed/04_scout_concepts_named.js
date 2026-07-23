// 04_scout_concepts_named.js — Replace SCOUT stage concepts with the
// canonical 12-concept curriculum, each carrying a proper `name` field.
//
// Run with:
//   mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" seed/04_scout_concepts_named.js
//
// Idempotent: deletes existing SCOUT concepts then upserts the 12 canonical ones.

const SCOUT_ID = UUID("10000000-1000-1000-1000-000000000001");

// Remove all existing SCOUT concepts
const deleted = db.concepts.deleteMany({ stageId: SCOUT_ID });
print(`✓ Removed ${deleted.deletedCount} existing SCOUT concepts`);

const concepts = [
  {
    _id: UUID("20000000-1000-1000-1000-000000000001"),
    stageId: SCOUT_ID,
    name: "Computational Thinking",
    order: 1,
    globalSource: "CS50 Week 0",
    sfiaSkill: "Software Development",
    sfiaLevel: 1,
    predefinedContentRef: {
      failureScenario: "A Nigerian fintech startup hired junior developers who jumped straight into code without analysing the problem. Their payment-routing feature worked for the demo scenario but failed for every edge case in production — wrong amounts sent, transactions duplicated — because no one had decomposed the problem or traced the algorithm before writing a line. The team spent three weeks in firefighting mode before the feature was stable.",
      teachingObjective: "Decompose a real-world problem into a finite, ordered set of unambiguous steps. Identify patterns, abstractions, and sub-problems. Express a solution as an algorithm before writing any code.",
      coreContent: "Computational thinking consists of four pillars: decomposition (breaking a problem into parts), pattern recognition (finding similarities), abstraction (filtering irrelevant detail), and algorithms (expressing step-by-step solutions). These skills are language-agnostic and underpin every engineering decision. Practise by describing everyday tasks as algorithms and using flowcharts or pseudocode to validate logic before implementation."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000002"),
    stageId: SCOUT_ID,
    name: "Clean Code Fundamentals",
    order: 2,
    globalSource: "Uncle Bob — Clean Code",
    sfiaSkill: "Software Development",
    sfiaLevel: 1,
    predefinedContentRef: {
      failureScenario: "The student writes code that works but is unreadable: single-letter variable names, functions hundreds of lines long, no consistent formatting, and comments that restate what the code does instead of why. A colleague cannot understand the code without asking the author.",
      teachingObjective: "Write code that communicates intent to a human reader without requiring explanation. Apply consistent naming conventions, keep functions focused on a single responsibility, and recognise when a comment is necessary versus when better naming removes the need for it.",
      coreContent: "Clean code is code that is easy to read, understand, and change. Key practices: meaningful, intention-revealing names; small functions that do one thing; no duplication (DRY); minimal comments — the code should explain itself; consistent formatting enforced by convention. Robert C. Martin's Clean Code and Google's style guides provide concrete rules. Clean code reduces defect density, eases onboarding, and lowers the cost of future changes."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000003"),
    stageId: SCOUT_ID,
    name: "Variables and Types",
    order: 3,
    globalSource: "CS50 Week 1",
    sfiaSkill: "Software Development",
    sfiaLevel: 1,
    predefinedContentRef: {
      failureScenario: "A payroll system at a Lagos logistics company stored salaries as VARCHAR instead of DECIMAL. A report query silently cast '150000.50' to an integer, truncating kobo values across 4,000 employees. Reconciliation took two weeks to untangle — money that should have been paid out was understated and employees were underpaid.",
      teachingObjective: "Declare variables with descriptive names and the correct primitive or reference type for the data they hold. Predict the result of arithmetic operations across different numeric types. Distinguish between value types (primitives) and reference types (objects).",
      coreContent: "Java provides eight primitive types: byte, short, int, long, float, double, char, and boolean. Each has a fixed size and range. Reference types (String, arrays, objects) store a memory address. Variables are containers that hold a value or reference; they must be declared before use. Type conversion can be implicit (widening) or explicit (casting, with potential data loss). Naming conventions in Java follow camelCase for variables, with names expressing what the variable represents, not how it is stored."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000004"),
    stageId: SCOUT_ID,
    name: "TDD Introduction",
    order: 4,
    globalSource: "Kent Beck — TDD by Example",
    sfiaSkill: "Software Development",
    sfiaLevel: 1,
    predefinedContentRef: {
      failureScenario: "A developer on a Nigerian health-tech platform wrote the implementation first and added tests as an afterthought. When a critical calculation bug was discovered in production — affecting patient dosage recommendations — there were no tests to pinpoint the regression. The team had to manually diff 40 commits to find the change that introduced it, wasting two engineer-days and delaying a compliance audit.",
      teachingObjective: "Apply the Red-Green-Refactor cycle: write a failing test first, write the minimum code to make it pass, then improve the design. Explain why writing the test before the implementation produces more testable, focused code.",
      coreContent: "Test-Driven Development (TDD) is a discipline in which you write a failing automated test before you write any production code. The cycle is: Red — write a test that fails because the feature does not exist yet; Green — write the simplest code that makes the test pass; Refactor — improve the structure of the code without changing its behaviour, keeping all tests green. TDD forces you to think about the API and expected behaviour before the implementation, resulting in smaller, more focused functions and a comprehensive regression suite. Kent Beck's TDD by Example demonstrates the technique in detail."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000005"),
    stageId: SCOUT_ID,
    name: "Conditionals",
    order: 5,
    globalSource: "CS50 Week 1",
    sfiaSkill: "Software Development",
    sfiaLevel: 1,
    predefinedContentRef: {
      failureScenario: "An African e-commerce platform's discount engine nested conditionals five levels deep. An edge case where a seller had both a verified badge AND a new-user coupon slipped through untested because the developer only thought about each condition in isolation. The platform paid out 3.4 million naira in duplicate discounts over a weekend before the bug was caught.",
      teachingObjective: "Express decision logic using if, if-else, if-else if, and switch statements. Reduce nesting by applying early-return and guard-clause patterns. Write conditions that are readable and account for every relevant case including edge cases.",
      coreContent: "Conditionals are the mechanism by which a program makes decisions. if evaluates a boolean expression; the body runs only when the expression is true. else handles the false branch. if-else if chains handle multiple mutually exclusive cases. switch compares a single expression against discrete values and is preferable when there are many distinct cases on the same variable. Java 14+ switch expressions return a value and use the arrow syntax, eliminating fall-through. Guard clauses invert conditions to handle exceptional cases early, reducing nesting and improving readability."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000006"),
    stageId: SCOUT_ID,
    name: "Loops",
    order: 6,
    globalSource: "CS50 Week 1",
    sfiaSkill: "Software Development",
    sfiaLevel: 1,
    predefinedContentRef: {
      failureScenario: "An ATM system in Lagos distributed a retry loop without an exit condition. When the interbank settlement service returned a timeout, the loop retried indefinitely, spawning 12,000 duplicate debit requests within 90 seconds. The bank's connection pool was exhausted; the ATM network went offline across 200 machines for four hours during a Friday evening peak period.",
      teachingObjective: "Implement for, while, and do-while loops to repeat computation efficiently. Avoid infinite loops and off-by-one errors. Apply break and continue to control loop execution. Recognise when recursion is a cleaner alternative to iteration.",
      coreContent: "Loops execute a block of code repeatedly while a condition holds. A for loop is idiomatic when the number of iterations is known in advance. A while loop is idiomatic when the termination condition depends on runtime state. A do-while loop guarantees at least one execution. The enhanced for (for-each) loop iterates over arrays and collections without an explicit index. Off-by-one errors arise from using strict vs. non-strict inequality; always trace through the boundary values mentally. Infinite loops are caused by forgetting to update the loop variable; use the debugger to step through when the loop does not terminate as expected."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000007"),
    stageId: SCOUT_ID,
    name: "Functions",
    order: 7,
    globalSource: "CS50 Week 1 + Uncle Bob",
    sfiaSkill: "Software Development",
    sfiaLevel: 2,
    predefinedContentRef: {
      failureScenario: "A 400-line processOrder method at a Nigerian logistics startup handled validation, pricing, inventory decrement, email sending, and database writes in one block. When a pricing bug appeared, no engineer could confidently change it without breaking everything else. The single function had no tests because it touched too many things at once. Refactoring it took three sprints.",
      teachingObjective: "Define and call methods with clear names, appropriate parameter lists, and a single well-defined return type. Apply the single-responsibility principle at the method level. Trace execution through the call stack and understand how method scope isolates local variables.",
      coreContent: "A method is a named, reusable block of code that accepts inputs (parameters), performs an action, and optionally returns a result. The method signature specifies the name, parameter types, and return type. The void return type signals that the method produces no value. Local variables exist only within the method scope; they are allocated on the stack when the method is invoked and released on return. Method overloading allows multiple methods to share a name if their parameter lists differ. Pure functions — those that depend only on their inputs and produce no side effects — are easiest to reason about and test in isolation."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000008"),
    stageId: SCOUT_ID,
    name: "Arrays and Lists",
    order: 8,
    globalSource: "CS50 Week 2",
    sfiaSkill: "Software Development",
    sfiaLevel: 2,
    predefinedContentRef: {
      failureScenario: "A Nigerian banking app accessed recentTransactions[0] without checking if the list was empty. New customers with no transaction history triggered an IndexOutOfBoundsException on the home screen — the first thing they saw after signing up. A 23% drop in day-1 retention was traced to this single missing bounds check.",
      teachingObjective: "Declare, initialise, and traverse fixed-size arrays and dynamic ArrayList collections. Perform common operations: add, remove, search, sort, and copy. Select the appropriate data structure based on whether the size is known at compile time.",
      coreContent: "An array is a fixed-length, contiguous block of elements of the same type, indexed from 0. Access time is O(1). Size cannot change after creation. ArrayList is a resizable array-backed list from java.util that automatically grows when capacity is exceeded; it provides O(1) amortised add at the end but O(n) insertion or removal in the middle. Arrays are preferred when the size is fixed and performance is critical; ArrayList is preferred for dynamic collections. Arrays.sort() and Collections.sort() provide built-in sorting using a merge sort variant. Arrays.copyOf() creates a new array with specified length, copying elements from the source."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000009"),
    stageId: SCOUT_ID,
    name: "Strings",
    order: 9,
    globalSource: "CS50 Week 2",
    sfiaSkill: "Software Development",
    sfiaLevel: 2,
    predefinedContentRef: {
      failureScenario: "A Nigerian job portal built SQL queries by concatenating user-supplied name fields directly into query text. During a security audit, a researcher submitted a SQL injection payload as a name. The query executed and wiped 80,000 applicant records in production. The company faced regulatory action from NITDA and a class-action suit from affected job-seekers.",
      teachingObjective: "Manipulate strings using the methods of java.lang.String: substring, indexOf, contains, replace, split, trim, and format. Use StringBuilder when building strings incrementally. Apply String.format() or text blocks for readable output. Always compare strings with .equals() or equalsIgnoreCase().",
      coreContent: "Strings in Java are immutable objects in the java.lang package; every operation that appears to modify a string actually creates a new one. The string pool interns literals, meaning two string literals with the same content share the same object — this is why == can return true for literals but is unreliable for general comparison. Key methods: length(), charAt(int), substring(int, int), indexOf(String), contains(CharSequence), replace(CharSequence, CharSequence), split(String), trim(), toUpperCase(), toLowerCase(), isEmpty(), isBlank(). StringBuilder is mutable and should be used when constructing strings via concatenation in a loop. Text blocks (Java 15+) allow multi-line strings with minimal escaping."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000010"),
    stageId: SCOUT_ID,
    name: "Algorithms with Big O",
    order: 10,
    globalSource: "CS50 Week 3",
    sfiaSkill: "Software Development",
    sfiaLevel: 2,
    predefinedContentRef: {
      failureScenario: "A Nigerian edtech startup implemented portfolio search using a linear scan across 500,000 unsorted learner records on every keystroke. Under a cohort of 200 concurrent users, each search triggered a full table scan. API response times climbed to 45 seconds; the CDN's 30-second timeout returned blank results to every user. The search feature was disabled for two weeks while engineers rebuilt it with proper indexing.",
      teachingObjective: "Express the time and space complexity of an algorithm using Big-O notation. Identify the complexity class of common patterns: O(1) lookup, O(log n) binary search, O(n) linear scan, O(n log n) comparison sort, O(n squared) nested iteration. Use complexity analysis to choose between competing implementations.",
      coreContent: "Big-O notation describes how the resource usage of an algorithm grows as the input size n increases, ignoring constant factors and lower-order terms. Common complexity classes: O(1) constant — independent of input size; O(log n) logarithmic — binary search, balanced BST operations; O(n) linear — single pass over input; O(n log n) linearithmic — efficient comparison-based sorting (merge sort, quicksort average case); O(n squared) quadratic — nested loops over the same input; O(2 to the n) exponential — brute-force combinatorial problems. Space complexity applies the same analysis to memory usage. Best, average, and worst cases can differ; Big-O typically describes worst case."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000011"),
    stageId: SCOUT_ID,
    name: "Memory and Storage",
    order: 11,
    globalSource: "CS50 Week 4",
    sfiaSkill: "Software Development",
    sfiaLevel: 2,
    predefinedContentRef: {
      failureScenario: "A Lagos startup's image-processing service kept references to large bitmap objects in a static cache that was never evicted. Under sustained load, heap memory filled up, the GC thrashed at 98% CPU, and the JVM threw OutOfMemoryError — crashing the service every 6 hours. Engineers restarted the process on a schedule instead of fixing the root cause for three weeks.",
      teachingObjective: "Describe how the JVM allocates memory on the stack and the heap. Explain the lifecycle of an object from allocation to garbage collection. Interpret a NullPointerException and trace its cause. Describe the difference between value semantics (primitives) and reference semantics (objects).",
      coreContent: "The JVM manages two main memory regions. The stack stores method frames, local variables, and return addresses; it is thread-local, fast, and automatically reclaimed when the method returns. The heap stores all objects and arrays; it is shared across threads and managed by the garbage collector. When a variable is declared with a reference type, the variable holds a memory address (reference) to the actual object on the heap, not the object itself. null means a reference variable holds no address; dereferencing null causes a NullPointerException. The garbage collector periodically identifies objects with no live references and reclaims their memory."
    }
  },
  {
    _id: UUID("20000000-1000-1000-1000-000000000012"),
    stageId: SCOUT_ID,
    name: "Data Structures",
    order: 12,
    globalSource: "CS50 Week 5",
    sfiaSkill: "Software Development",
    sfiaLevel: 2,
    predefinedContentRef: {
      failureScenario: "A Nigerian social platform used an ArrayList to back a notification feed, scanning from the beginning on every read to find unseen items. With 2 million users each having thousands of notifications, the O(n) scan made the notification endpoint time out under normal load. Replacing it with a linked-list-backed queue reduced p99 latency from 8 seconds to 40ms.",
      teachingObjective: "Select the appropriate data structure for a problem based on its access pattern. Describe the time complexity of the core operations (add, remove, search, access) for arrays, linked lists, stacks, queues, hash maps, and sets. Implement a stack and queue using Java collections.",
      coreContent: "A data structure organises data to support efficient operations. Arrays provide O(1) indexed access but O(n) insert/delete in the middle. Linked lists provide O(1) insert/delete at a known node but O(n) traversal to find a node. A stack (LIFO) supports push and pop in O(1); Deque is the Java idiomatic stack. A queue (FIFO) supports enqueue and dequeue in O(1); LinkedList and ArrayDeque implement Queue. A HashMap provides O(1) average key lookup, insert, and delete by computing a hash of the key. A HashSet stores unique elements with O(1) contains, add, and remove. A tree (e.g. TreeMap, TreeSet) stores elements in sorted order with O(log n) operations."
    }
  }
];

let inserted = 0;
concepts.forEach(c => {
  db.concepts.replaceOne({ _id: c._id }, c, { upsert: true });
  inserted++;
});

print(`\u2713 ${inserted} SCOUT concepts upserted with correct names and real failure scenarios`);
const count = db.concepts.countDocuments({ stageId: SCOUT_ID });
print(`\u2713 Total SCOUT concepts in DB: ${count}`);
