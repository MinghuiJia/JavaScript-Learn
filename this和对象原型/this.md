<!--
 * @Author: jiaminghui
 * @Date: 2022-12-07 20:46:41
 * @LastEditTime: 2023-02-07 15:46:45
 * @LastEditors: jiaminghui
 * @FilePath: \JavaScript_Learn\this和对象原型\this.md
 * @Description: 
-->
# this的学习

## 关于this

### 用this的原因
1.  使用this可以在不同的上下文对象中重复使用函数，而不用针对每个对象编写不同版本的函数
    ```javascript
    function identify() {
        return this.name.toUpperCase();
    }
    function speak() {
        var greeting = "Hello, I'm " + identify.call( this );
        console.log( greeting );
    }
    var me = {
        name: "Kyle"
    };
    var you = {
        name: "Reader"
    };
    identify.call( me ); // KYLE
    identify.call( you ); // READER
    speak.call( me ); // Hello, 我是 KYLE
    speak.call( you ); // Hello, 我是 READER
    ```
    - 上述代码中，在函数`identify`与`speak`中使用this，可以被不同的对象`me`与`you`使用
    - 如果不使用this，则需要给`identify`与`speak`函数显式地传递对象引用
    ```javascript
    function identify(context) {
        return context.name.toUpperCase();
    }
    function speak(context) {
        var greeting = "Hello, I'm " + identify( context );
        console.log( greeting );
    }
    identify( you ); // READER
    speak( me ); //hello, 我是 KYLE
    ```
    - this提供了一种更优雅的方式来隐式“传递”一个对象引用，因此可以将API设计得更加简洁并且易于复用
    - 显式传递上下文对象会让代码变得越来越混乱

### 对this的误解
1.  对this的误解分为两种
    - 指向自身：把this理解成指向函数自身
    - 指向它的作用域：this指向函数的作用域
2.  指向自身
    - 在函数内部引用函数自身的原因是：
        - **递归（从函数内部调用这个函数）**
        - 在函数第一次被调用后**自己解除绑定的事件处理器**
    - 由于**函数**可以看作是一个**对象**，那就可以在调用函数时**存储状态**（属性的值）
    - 但是除了函数对象还有许多更合适存储状态的地方
        ```javascript
        function foo(num) {
            console.log( "foo: " + num );
            // 记录 foo 被调用的次数
            this.count++;
        }
        foo.count = 0;
        var i;
        for (i=0; i<10; i++) {
            if (i > 5) {
                foo( i );
            }
        }
        // foo: 6
        // foo: 7
        // foo: 8
        // foo: 9
        // foo 被调用了多少次？
        console.log( foo.count ); // 0 -- WTF?
        ```
    - `console.log`输出了4次，即函数被调用了4次，但实际上`foo`存储的`count`变量输出却是0
    - `foo.count = 0;`的确向函数对象foo添加了一个属性count；但是this.count中的**this并不是指向那个函数对象**
    - `this.count++;`其实创建了一个全局变量count，它的值为NaN（具体原理在后面会介绍到）
    - 解决计数的方式是使用词法作用域，创建一个对象`var data={count:0}`来记录函数被调用（`data.count++;`）的次数
    - 函数对象内部引用自身的方式：
        ```javascript
        function foo() {
            foo.count = 4; // foo 指向它自身
        }
        setTimeout( function(){
            // 匿名（没有名字的）函数无法指向自身
        }, 10 );
        ```
        - 具名函数，在它内部可以使用函数名称（`foo`）来引用自身
        - 匿名函数，无法从函数内部引用自身。唯一可以引用自身的匿名函数方式：`arguments.callee`，但这种方式已经被弃用
    - 可以引用函数对象，就可以实现利用函数对象的属性计数了
        ```javascript
        function foo(num) {
            console.log( "foo: " + num );
            // 记录 foo 被调用的次数
            foo.count++;
        }
        foo.count=0
        var i;
        for (i=0; i<10; i++) {
            if (i > 5) {
                foo( i );
            }
        }
        // foo: 6
        // foo: 7
        // foo: 8
        // foo: 9
        // foo 被调用了多少次？
        console.log( foo.count ); // 4
        ```
        - 这种方式回避了this的使用，原理是使用了`foo`函数变量的词法作用域
    - 另一种方式是强制将this绑定到foo函数对象：
        ```javascript
        function foo(num) {
            console.log( "foo: " + num );
            // 记录 foo 被调用的次数
            this.count++;
        }
        foo.count=0
        var i;
        for (i=0; i<10; i++) {
            if (i > 5) {
                foo.call( foo, i );
            }
        }
        // foo: 6
        // foo: 7
        // foo: 8
        // foo: 9
        // foo 被调用了多少次？
        console.log( foo.count ); // 4
        ```
3.  指向它的作用域
    - 首先明确：this在任何情况下都**不指向函数的词法作用域**
    - 作用域也可以理解为**对象**，可见标识符都是对象内的属性，但是作用域对象无法通过JavaScript代码访问，只存在于JavaScript引擎内部
    - 下述代码中：
        ```javascript
        function foo() {
            var a = 2;
            this.bar();
        }
        function bar() {
            console.log( this.a );
        }
        foo(); // ReferenceError: a is not defined
        ```
        - `this.bar();`是错误的，正确的方式就是直接调用`bar()`，直接使用词法引用标识符
        - 试图通过this联通`foo`与`bar`的词法作用域，从而让`bar`可以访问`foo`作用域里的变量a是不可能的。因为不能使用this来引用一个词法作用域内部的东西

### this到底是什么
1.  this是在运行时进行绑定的，并不是在编写时绑定，它的上下文取决于函数调用时的各种条件
2.  this的绑定和函数声明的位置没有任何关系，只取决于函数的调用方式
3.  当一个函数被调用时，会创建一个活动记录（有时候也称为执行上下文）
    - 这个记录会包含函数在哪里被调用（调用栈）、函数的调用方法、传入的参数等信息
    - this就是记录的其中一个属性，会在函数执行的过程中用到

## this全面解析

### 调用位置
1.  调用位置：是函数在代码中被调用的位置（而不是声明的位置）
2.  分析寻找调用位置的关键是分析**调用栈**，调用位置是在调用栈中**当前正在执行函数**的**前一个**调用中
    ```javascript
    function baz() {
        // 当前调用栈是：baz
        // 因此，当前调用位置是全局作用域
        console.log( "baz" );
        bar(); // <-- bar 的调用位置
    }
    function bar() {
        // 当前调用栈是 baz -> bar
        // 因此，当前调用位置在 baz 中
        console.log( "bar" );
        foo(); // <-- foo 的调用位置
    }
    function foo() {
        // 当前调用栈是 baz -> bar -> foo
        // 因此，当前调用位置在 bar 中
        console.log( "foo" );
    }
    baz(); // <-- baz 的调用位置
    ```

### 绑定规则
1.  绑定规则：是在确定了函数的调用位置之后，用于判断满足哪一条绑定规则，当多条规则同时满足时，规则之间又有优先级
2.  规则一：默认绑定，this指向全局对象
    - 独立函数调用，这条规则可以看作是无法应用其他规则时的默认规则
        ```javascript
        function foo() { 
            console.log( this.a );
        }
        var a = 2;
        foo(); // 2
        ```
    - 声明在全局作用域中的变量（`var a = 2`）就是全局对象的一个同名属性
    - 上述代码中，函数调用时应用了this的默认绑定，因此this指向全局对象
    - `foo`函数是直接使用不带任何修饰的函数引用进行调用的，只能使用**默认绑定**
    - 在**严格模式**下，全局对象将无法使用默认绑定，因此this会绑定到undefined
        ```javascript
        function foo() { 
            "use strict";
            console.log( this.a ); 
        }
        var a = 2;
        foo(); // TypeError: this is undefined
        ```
    - 注意：只有在**非严格模式下**，默认绑定才能绑定到**全局对象**；而**严格模式下**，this绑定**与调用位置无关**
        ```javascript
        function foo() { 
            console.log( this.a );
        }
        var a = 2;
        (function(){ 
            "use strict";
            foo(); // 2 
        })();
        ```
        - 上述代码`foo`是非严格模式，所以应用默认规则，this绑定到全局对象，因此输出2
3.  规则二：隐式绑定，函数中的this会绑定在被调用位置的上下文对象
    - 函数的调用位置会使用上下文对象来引用函数，该函数被调用时的对象拥有或包含
        ```javascript
        function foo() { 
            console.log( this.a );
        }
        var obj = { 
            a: 2,
            foo: foo 
        };
        obj.foo(); // 2
        ```
        - 上述代码函数`foo`中的this会被绑定到`obj`上下文对象
    - 对象属性引用链中只有最后一层会影响调用位置
        ```javascript
        function foo() { 
            console.log( this.a );
        }
        var obj2 = { 
            a: 42,
            foo: foo 
        };
        var obj1 = { 
            a: 2,
            obj2: obj2 
        };
        obj1.obj2.foo(); // 42
        ```
        - 在对象属性的引用链中`obj1.obj2`，`obj2`位于最后一层，所以`foo`中的this绑定到`obj2`
    - 隐式丢失
        **被隐式绑定的函数**会丢失绑定对象，然后会应用**默认绑定**，把this绑定到全局对象或undefined
        ```javascript
        function foo() { 
            console.log( this.a );
        }
        var obj = { 
            a: 2,
            foo: foo 
        };
        var bar = obj.foo; // 函数别名！
        var a = "oops, global"; // a 是全局对象的属性
        bar(); // "oops, global"
        ```
        - 上述代码中，虽然`bar`变量与`obj.foo`是同一个引用。但是在赋值过程中仅仅将`foo`函数本身引用，`bar()`其实是一个**不带有任何修饰的函数调用**，从而应用了默认绑定
        ```javascript
        function foo() { 
            console.log( this.a );
        }
        function doFoo(fn) {
            // fn 其实引用的是 foo
            fn(); // <-- 调用位置！
        }
        var obj = { 
            a: 2,
            foo: foo 
        };
        var a = "oops, global"; // a 是全局对象的属性
        doFoo( obj.foo ); // "oops, global"
        ```
        - 上述代码是将函数`foo`传入回调函数`doFoo`，参数传递过程其实是**隐式赋值**，就导致了与隐式丢失案例代码1一样的情况
        - 上述代码传入的函数是自己声明的函数，即使传入内置的函数结果也是一样的
            ```javascript
            function foo() { 
                console.log( this.a );
            }
            var obj = { 
                a: 2,
                foo: foo 
            };
            var a = "oops, global"; // a 是全局对象的属性
            setTimeout( obj.foo, 100 ); // "oops, global"
            ```
            - 因此回调函数丢失this绑定是非常常见的
            - 在一些回调函数中，也可能会修改this的绑定。例如：JavaScript库中**事件处理器**常会把回调函数的this**强制绑定到触发事件的DOM元素**上
4.  规则三，显式绑定，将this强制绑定到指定对象上
    - 隐式绑定的方式是需要在对象内部包含一个指向调用函数的引用属性，才能把this绑定到对象上
    - 显式绑定可以帮助我们**不在对象内部包含函数引用**，而在对象上**强制调用函数**
    - JavaScript中的函数可以使用`call(...)`与`apply(...)`进行显式绑定
        ```javascript
        function foo() { 
            console.log( this.a );
        }
        var obj = { 
            a:2
        };
        foo.call( obj ); // 2
        ```
        - 上述代码通过`call`显式绑定this到`obj`上
        - 如果传入的是原始值（字符串类型、布尔类型或者数字类型）来当作this的绑定对象，这个原始值会被转换成它的对象形式（`new String(..)`、`new Boolean(..)`或者`new Number(..)`），这种方式被称为**装箱**
        - 但显式绑定不能解决绑定丢失的问题
    - 解决绑定丢失问题的方案：
        1. 硬绑定可以解决绑定丢失问题
            ```javascript
            function foo() { 
                console.log( this.a );
            }
            var obj = { 
                a:2
            };
            var bar = function() {
                foo.call( obj );
            };
            bar(); // 2
            setTimeout( bar, 100 ); // 2
            // 硬绑定的 bar 不可能再修改它的 this
            bar.call( window ); // 2
            ```
            - 上述代码对`foo`进行了硬绑定
            - 硬绑定是因为将`foo`包裹在`bar`函数内，在内部总是显式地绑定this到`obj`对象，这样即使任何情况调用`bar`，总会在执行`bar`时手动将this绑定到`obj`
            - 硬绑定的特点是创建一个**包裹函数**，传入所有的参数并返回接收到的所有值
                ```javascript
                function foo(something) { 
                    console.log( this.a, something ); 
                    return this.a + something;
                }
                var obj = { 
                    a:2
                };
                var bar = function() {
                    return foo.apply( obj, arguments );
                };
                var b = bar( 3 ); // 2 3
                console.log( b ); // 5
                ```
                - 函数定义时没有指定形参, 调用时仍然可以向其传递参数,  通过默认参数arguments获取, arguments是一个伪数组, 用来获取实参列表
            - 硬绑定的变形，创建可重复使用的辅助函数
                ```javascript
                function foo(something) { 
                    console.log( this.a, something ); 
                    return this.a + something;
                }
                // 简单的辅助绑定函数
                function bind(fn, obj) { 
                    return function() {
                        return fn.apply( obj, arguments ); 
                    };
                }
                var obj = { 
                    a:2
                };
                var bar = bind( foo, obj ); 
                var b = bar( 3 ); // 2 3
                console.log( b ); // 5
                ```
                - 这里创建了一个`bind`函数用于对函数中的this进行硬绑定
                - 上述手动创建硬绑定函数的方法在ES5中有`Function.prototype.bind`内置方法可直接实现`var bar = foo.bind( obj );`，`bind()`会返回一个硬编码的新函数，把传递的参数设置为this的上下文
        2.  API调用的“上下文”
            ```javascript
            function foo(el) { 
                console.log( el, this.id );
            }
            var obj = {
                id: "awesome"
            };
            // 调用 foo(..) 时把 this 绑定到 obj
            [1, 2, 3].forEach( foo, obj );
            // 1 awesome 2 awesome 3 awesome
            ```
            - 上述代码`forEach`函数第一个参数是一个回调函数，第二个参数就是用于给回调函数内的this绑定的对象
            - 这些函数实际上就是通过`call(..)`或者`apply(..)`实现了显式绑定
5.  规则四，new绑定，将this强制绑定到指定对象上
    - 传统的面向类的语言中，使用new初始化类时会调用类中的构造函数`something = new MyClass(..);`
    - JavaScript中的new机制和面向类的语言完全不同
    - JavaScript中的构造函数**只是一些使用new操作符时被调用的函数**，并不会属于某个类，也不会实例化一个类，**只是被new操作符调用的普通函数而已**
    - 实际上并不存在所谓的“构造函数”，只有对于函数的“构造调用”。（包括内置对象函数在内的所有函数都可以用new来调用）
    - 使用new来调用函数，会自动执行下面的操作
        - 创建（或者说构造）一个全新的对象
        - 这个新对象会被执行[[ 原型 ]]连接
        - 这个新对象会绑定到函数调用的this
        - 如果函数没有返回其他对象，那么new表达式中的函数调用会自动返回这个新对象
        ```javascript
        function foo(a) {
            this.a = a;
        }
        var bar = new foo(2);
        console.log( bar.a ); // 2
        ```
        - 使用new调用`foo`函数，会创建出一个新的对象`bar`，并将`bar`绑定到`foo`中的this上

### 绑定规则的优先级
1.  确定this的绑定，我们需要找到函数的调用位置并判断应当应用哪条规则。但如果某个调用位置可以应用多条规则，这些规则之间就需要基于优先级完成判断
2.  隐式绑定与显式绑定的优先级：**显式绑定优先级高于隐式绑定**
    ```javascript
    function foo() { 
        console.log( this.a );
    }
    var obj1 = { 
        a: 2,
        foo: foo
    };
    var obj2 = { 
        a: 3,
        foo: foo 
    };
    obj1.foo(); // 2 
    obj2.foo(); // 3
    obj1.foo.call( obj2 ); // 3 
    obj2.foo.call( obj1 ); // 2
    ```
3.  new绑定与隐式绑定的优先级：**new绑定优先级高于隐式绑定**
    ```javascript
    function foo(something) { 
        this.a = something;
    }
    var obj1 = { 
        foo: foo
    };
    var obj2 = {};
    obj1.foo( 2 ); 
    console.log( obj1.a ); // 2
    obj1.foo.call( obj2, 3 ); 
    console.log( obj2.a ); // 3
    var bar = new obj1.foo( 4 ); 
    console.log( obj1.a ); // 2 
    console.log( bar.a ); // 4
    ```

4.  new绑定与显式绑定：**new绑定优先级高于显式绑定**
    - new与call/apply无法一起使用，因此无法通过`new foo.call(obj1)`来使用
    ```javascript
    function foo(something) { 
        this.a = something;
    }
    var obj1 = {};
    var bar = foo.bind( obj1 ); 
    bar( 2 );
    console.log( obj1.a ); // 2
    var baz = new bar(3); 
    console.log( obj1.a ); // 2 
    console.log( baz.a ); // 3
    ```
    - `foo`函数中的this被硬绑定到`obj1`上，返回了`bar`函数；而`new bar(3)`并没有将`obj1.a`修改为3，而是修改了调用`bar`中的this
    - 因为使用了new绑定，会创建出一个新对象`baz`，`bar`函数调用时的this绑定了`baz`对象，使得`baz.a`的值为3
    - 从自己封装的硬绑定函数中可以看出，new绑定并不会修改this绑定
        ```javascript
        function bind(fn, obj) { 
            return function() {
                fn.apply( obj, arguments );
            };
        }
        ```
    - 但在ES5中内置的`bind`会判断硬绑定函数是否被new调用，如果是的话就会使用**新创建的this替换硬绑定的this**
    - 从上面逻辑可以看出，为什么在调用new绑定时使用硬绑定后的函数而不是使用普通函数。这是因为在new中使用硬绑定函数，主要目的是**预先设置函数的一些参数**，在使用new进行初始化时就可以只传入其余的参数
    - 在bind中除了传递的第一个参数用于绑定this，其余参数可以传递给下层（硬绑定）函数——这种技术叫做**部分应用**，是**柯里化**的一种
        ```javascript
        function foo(p1,p2) { 
            this.val = p1 + p2;
        }
        // 之所以使用 null 是因为在本例中我们并不关心硬绑定的 this 是什么
        // 反正使用 new 时 this 会被修改
        var bar = foo.bind( null, "p1" );
        var baz = new bar( "p2" ); 
        baz.val; // p1p2
        ```
5.  总结this判断的过程
    1.  函数是否在new中调用（new绑定）？如果是的话this绑定的是新创建的对象
    ```javascript
    var bar = new foo()
    ```
    2.  函数是否通过call、apply（显式绑定或者硬绑定（bind）调用？如果是的话，this绑定的是指定的对象
    ```javascript
    var bar = foo.call(obj2)
    ```
    3.  函数是否在某个上下文对象中调用（隐式绑定）？如果是的话，this绑定的是那个上下文对象
    ```javascript
    var bar = obj1.foo()
    ```
    4.  如果都不是的话，使用默认绑定。如果在严格模式下，就绑定到undefined，否则绑定到全局对象（window）
    ```javascript
    var bar = foo()
    ```
### 绑定例外
1.  如果把null或undefined作为this的绑定对象传入call、apply、bind时，这些值会被**忽略**，实际使用的时**默认绑定规则**
    ```javascript
    function foo() { 
        console.log( this.a );
    }
    var a = 2;
    foo.call( null ); // 2
    ```
    - 传入null或undefined的场景：函数不关心this，但需要传入一个占位置
        1.  展开数组（在ES6中可以使用`...`对数组展开；`foo(...[1,2])`等价于`foo(1,2)`，避免了不必要的this绑定）
            ```javascript
            function foo(a,b) {
                console.log( "a:" + a + ", b:" + b );
            }
            // 把数组“展开”成参数
            foo.apply( null, [2, 3] ); // a:2, b:3
            ```
        2.  对参数进行柯里化（预先设置一些参数）
            ```javascript
            function foo(a,b) {
                console.log( "a:" + a + ", b:" + b );
            }
            // 使用 bind(..) 进行柯里化
            var bar = foo.bind( null, 2 ); 
            bar( 3 ); // a:2, b:3
            ```
    - 这种绑定忽略的方式，会导致this绑定到全局对象（浏览器是window），从而对全局对象进行误操作
    - 更加安全的方式是创建一个空对象`Object.create(null)`（非委托对象，不会创建`prototype`委托，比`{}`更空）并传入到显示绑定中
        ```javascript
        function foo(a,b) {
            console.log( "a:" + a + ", b:" + b );
        }
        // 我们的 DMZ 空对象
        var ø = Object.create( null );
        // 把数组展开成参数
        foo.apply( ø, [2, 3] ); // a:2, b:3
        // 使用 bind(..) 进行柯里化
        var bar = foo.bind( ø, 2 ); 
        bar( 3 ); // a:2, b:3
        ```
2.  创建函数的间接引用会导致this绑定应用默认绑定规则（在赋值时最容易产生间接引用）
    ```javascript
    function foo() { 
        console.log( this.a );
    }
    var a = 2; 
    var o = { a: 3, foo: foo }; 
    var p = { a: 4 };
    o.foo(); // 3
    (p.foo = o.foo)(); // 2
    ```
    - 注意：默认绑定决定this绑定对象的**并不是调用位置是否处于严格模式**，而是函数体是否处于严格模式
3.  软绑定
    - 之前介绍的硬绑定虽然可以将this强制绑定到指定对象，但是会造成函数无法使用隐式绑定或显式绑定来修改this
    - 软绑定是给默认绑定指定一个全局对象和undefined以外的值，同时保留隐式绑定或显式绑定修改this的能力
    - 使用`softBind(..)`完成软绑定，当函数this绑定到全局对象或者undefined时，就把指定的默认对象obj绑定到this，否则不修改this绑定（软绑定也支持柯里化）
        ```javascript
        function foo() {
            console.log("name: " + this.name);
        }
        var obj = { name: "obj" }, 
            obj2 = { name: "obj2" }, 
            obj3 = { name: "obj3" };
        var fooOBJ = foo.softBind( obj ); 
        fooOBJ(); // name: obj
        obj2.foo = foo.softBind(obj); 
        obj2.foo(); // name: obj2 <---- 看！！！
        fooOBJ.call( obj3 ); // name: obj3 <---- 看！
        setTimeout( obj2.foo, 10 );
        // name: obj <---- 应用了软绑定
        ```
### this词法
1.  ES6中的箭头函数不能使用this绑定的四种规则，而是根据**外层作用域来决定this**
    ```javascript
    function foo() {
        // 返回一个箭头函数
        return (a) => {
            //this 继承自 foo()
            console.log( this.a ); 
        };
    }
    var obj1 = { 
        a:2
    };
    var obj2 = { 
        a:3
    };
    var bar = foo.call( obj1 );
    bar.call( obj2 ); // 2, 不是 3 ！
    ```
    - `var bar = foo.call( obj1 );`会将`foo`中的this绑定到`obj1`；`foo`内部的箭头函数会捕捉外层作用域（`foo`）的this，并且不会被任何绑定规则修改
2.  箭头函数常用于回调函数中
    ```javascript
    function foo() { 
        setTimeout(() => {
            // 这里的 this 在此法上继承自 foo()
            console.log( this.a ); 
        },100);
    }
    var obj = { 
        a:2
    };
    foo.call( obj ); // 2
    ```
3.  在ES6之前就已经使用一种几乎和箭头函数完全一样的模式
    ```javascript
    function foo() {
        var self = this; // lexical capture of this 
        setTimeout( function(){
            console.log( self.a );
        }, 100 );
    } 
    var obj = {
        a: 2
    };
    foo.call( obj ); // 2
    ```
    - 上述代码其实也是一种闭包，使用`var self = this;`替代this机制，变成了更常见的词法作用域