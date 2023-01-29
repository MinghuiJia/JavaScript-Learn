<!--
 * @Author: jiaminghui
 * @Date: 2023-01-25 11:13:31
 * @LastEditTime: 2023-01-29 17:34:57
 * @LastEditors: jiaminghui
 * @FilePath: \JavaScript_Learn\异步和性能\Promise.md
 * @Description: 
-->
# Promise的学习
回调存在控制反转问题，使得信任很脆弱，也很容易失去。如果我们能够把控制反转再反转回来，**希望第三方给我们提供了解其任务何时结束的能力，然后由我们自己的代码来决定下一步做什么**，这种范式就称为Promise
## 什么是Promise
1.  以购买汉堡为类比例子：由于我购买一个汉堡后不能马上就得到这个汉堡，**一张带有订单号的收据就是一个IOU（I owe you，我欠你的）承诺（promise）**，保证了最终我会得到我的汉堡。此外，尽管现在我还没有拿到手汉堡，但是我可以去做一些其他的事情，我的大脑之所以可以这么做，是因为它已经把订单号当作芝士汉堡的占位符了。**从本质上讲，这个占位符使得这个值不再依赖时间，这是一个未来值**。**未来值有一个重要特性：它可能成功，也可能失败**
2.  `x+y`这样一个运算表达式，期望x和y在都已经准备好的情况下再立即执行加法运算。但是这样会导致语句中既有现在又有将来，使得程序混乱。解决的方法之一就是使用回调来解决，将语句中全部转换为将来
    ```javascript
    function add(getX,getY,cb) { 
        var x, y; 
        getX( function(xVal){ 
            x = xVal; 
            // 两个都准备好了？
            if (y != undefined) { 
                cb( x + y ); // 发送和
            } 
        } ); 
        getY( function(yVal){ 
            y = yVal; 
            // 两个都准备好了？
            if (x != undefined) { 
                cb( x + y ); // 发送和
            } 
        } ); 
    } 
    // fetchX() 和fetchY()是同步或者异步函数
    add( fetchX, fetchY, function(sum){ 
        console.log( sum ); // 是不是很容易？
    } ); 
    ```
    - 在这段代码中，我们把x和y当作未来值，并且表达了一个运算`add(..)`，这个运算（从外部看）不在意x和y现在是否都已经可用。换句话说，它把现在和将来归一化了，因此我们可以确保这个`add(..)`运算的输出是可预测的
    - 为了统一处理现在和将来，我们把它们都变成了将来，即所有的操作都成了异步的
3.  通过Promise函数表达这个`x + y`的例子
    ```javascript
    function add(xPromise,yPromise) { 
        // Promise.all([ .. ])接受一个promise数组并返回一个新的promise，
        // 这个新promise等待数组中的所有promise完成
        return Promise.all( [xPromise, yPromise] ) 
        // 这个promise决议之后，我们取得收到的X和Y值并加在一起
        .then( function(values){ 
            // values是来自于之前决议的promisei的消息数组
            return values[0] + values[1]; 
        } ); 
    } 
    // fetchX()和fetchY()返回相应值的promise，可能已经就绪，
    // 也可能以后就绪 
    add( fetchX(), fetchY() ) 
    // 我们得到一个这两个数组的和的promise
    // 现在链式调用 then(..)来等待返回promise的决议
    .then( function(sum){ 
        console.log( sum ); // 这更简单！
    } ); 
    ```
    - `fetchX()`和`fetchY()`是直接调用的，它们的返回值（promise！）被传给`add(..)`
    - 这些promise代表的底层值的可用时间可能是现在或将来，但不管怎样，promise归一保证了行为的一致性。我们可以按照不依赖于时间的方式追踪值X和Y，它们是未来值
    - 第二层是`add(..)`（通过`Promise.all([ .. ])`）创建并返回的promise。我们通过调用`then(..)`等待这个promise。`add(..)`运算完成后，未来值sum就准备好了，可以打印出来。我们把等待未来值X和Y的逻辑隐藏在了`add(..)`内部
4.  Promise的决议结果可能是拒绝而不是完成。拒绝值和完成的Promise不一样：完成值总是编程给出的，而拒绝值，通常称为拒绝原因，可能是程序逻辑直接设置的，也可能是从运行异常隐式得出的值
    - 通过Promise，调用`then(..)`实际上可以接受两个函数，第一个用于完成情况（如前所示），第二个用于拒绝情况
        ```javascript
        add( fetchX(), fetchY() ) 
        .then( 
            // 完成处理函数
            function(sum) { 
                console.log( sum ); 
            }, 
            // 拒绝处理函数
            function(err) { 
                console.error( err ); // 烦！
            } 
        ); 
        ```
        - 如果在获取X或Y的过程中出错，或者在加法过程中出错，`add(..)`返回的就是一个被拒绝的promise，传给`then(..)`的第二个错误处理回调就会从这个promise中得到拒绝值
    - 由于Promise封装了依赖于时间的状态——等待底层值的完成或拒绝，所以Promise本身是与时间无关的。因此，Promise可以按照可预测的方式组成（组合），而不用关心时序或底层的结果
    - 另外，一旦Promise决议（准备好），它就永远保持在这个状态。此时它就成为了不变值，可以根据需求多次查看
5.  假定要调用一个函数`foo(..)`执行某个任务。我们不知道也不关心它的任何细节。这个函数可能立即完成任务，也可能需要一段时间才能完成。我们只需要知道`foo(..)`什么时候结束，这样就可以进行下一个任务。换句话说，我们想要通过某种方式在`foo(..)`完成的时候得到通知，以便可以继续下一步。在JavaScript中我们可以把对通知的需求重新组织为对`foo(..)`发出的一个完成事件的侦听
    - 使用回调的话，通知就是任务（`foo(..)`）调用的回调。而使用Promise的话，我们把这个关系反转了过来，侦听来自`foo(..)`的事件，然后在得到通知的时候，根据情况继续
        ```javascript
        foo(x) { 
            // 开始做点可能耗时的工作
        } 
        foo( 42 ) 
        on (foo "completion") { 
            // 可以进行下一步了！
        } 
        on (foo "error") { 
            // 啊，foo(..)中出错了
        } 
        ```
        - 我们调用`foo(..)`，然后建立了两个事件侦听器，一个用于"completion"，一个用于"error"——`foo(..)`调用的两种可能结果。从本质上讲，`foo(..)`并不需要了解调用代码订阅了这些事件，这样就很好地实现了关注点分离
        - 遗憾的是这种环境并不存在（实际上也有点不实际），以下是在JavaScript中更自然的表达方法
            ```javascript
            function foo(x) { 
                // 开始做点可能耗时的工作
                // 构造一个listener事件通知处理对象来返回
                return listener; 
            } 
            var evt = foo( 42 ); 
            evt.on( "completion", function(){ 
                // 可以进行下一步了！
            } ); 
            evt.on( "failure", function(err){ 
                // 啊，foo(..)中出错了
            } ); 
            ```
            - `foo(..)`显式创建并返回了一个事件订阅对象，调用代码得到这个对象，并在其上注册了两个事件处理函数
            - 相对于面向回调的代码，这里的反转是显而易见的，这里没有把回调传给`foo(..)`，而是返回一个名为evt的事件注册对象，由它来接受回调
            - 回调本身就表达了一种控制反转，所以Promise是对回调模式的反转，实际上是对反转的反转，或者称为反控制反转——把控制返还给调用代码
            - 一个很重要的好处是，可以把这个事件侦听对象提供给代码中多个独立的部分；在`foo(..)`完成的时候，它们都可以独立地得到通知，以执行下一步
                ```javascript
                var evt = foo( 42 ); 
                // 让bar(..)侦听foo(..)的完成
                bar( evt ); 
                // 并且让baz(..)侦听foo(..)的完成
                baz( evt ); 
                ```
                - 对控制反转的恢复实现了更好的关注点分离，其中`bar(..)`和`baz(..)`不需要牵扯到`foo(..)`的调用细节。类似地，`foo(..)`不需要知道或关注`bar(..)`和`baz(..)`是否存在，或者是否在等待`foo(..)`的完成通知
                - 从本质上说，evt对象就是分离的关注点之间一个中立的第三方协商机制
    -  Promise事件
        - 事件侦听对象evt就是Promise的一个模拟，在基于Promise的方法中，前面的代码片段会让`foo(..)`创建并返回一个Promise实例，而且这个 Promise会被传递到`bar(..)`和`baz(..)`
            ```javascript
            function foo(x) { 
                // 可是做一些可能耗时的工作
                // 构造并返回一个promise
                return new Promise( function(resolve,reject){ 
                    // 最终调用resolve(..)或者reject(..)
                    // 这是这个promise的决议回调
                } ); 
            } 
            var p = foo( 42 ); 
            bar( p ); 
            baz( p ); 
            ```
            - `new Promise( function(..){ .. } )`模式通常称为revealing constructor，传入的函数会立即执行（不会像`then(..)`中的回调一样异步延迟），它有两个参数，在本例中我们将其分别称为resolve和reject。这些是promise的决议函数。`resolve(..)`通常标识完成，而`reject(..)`则标识拒绝
        - `bar(..)`和`baz(..)`的内部实现或许如下
            ```javascript
            function bar(fooPromise) { 
                // 侦听foo(..)完成
                fooPromise.then( 
                    function(){ 
                        // foo(..)已经完毕，所以执行bar(..)的任务
                    }, 
                    function(){ 
                        // 啊，foo(..)中出错了！
                    } 
                ); 
            } 
            // 对于baz(..)也是一样
            ```
            - Promise决议并不一定要像前面将Promise作为未来值查看时一样会涉及发送消息。它也可以只作为一种流程控制信号，就像前面这段代码中的用法一样
        - 另外一种实现方式是
            ```javascript
            function bar() { 
                // foo(..)肯定已经完成，所以执行bar(..)的任务
            } 
            function oopsBar() { 
                // 啊，foo(..)中出错了，所以bar(..)没有运行
            } 
            // 对于baz()和oopsBaz()也是一样
            var p = foo( 42 ); 
            p.then( bar, oopsBar ); 
            p.then( baz, oopsBaz );
            ```
            - 这里没有把promise p传给`bar(..)`和`baz(..)`，而是使用promise控制`bar(..)`和`baz(..)`何时执行，如果执行的话。最主要的区别在于错误处理部分
            - 在第一段代码的方法里，不论`foo(..)`成功与否，`bar(..)`都会被调用。并且如果收到了`foo(..)`失败的通知，它会亲自处理自己的回退逻辑
            - 在第二段代码中，`bar(..)`只有在`foo(..)`成功时才会被调用，否则就会调用`oppsBar(..)`
            - 另外，两段代码都以使用promise p调用`then(..)`两次结束，这个事实说明了前面的观点，就是Promise（一旦决议）一直保持其决议结果（完成或拒绝）不变，可以按照需要多次查看，一旦p决议，不论是现在还是将来，下一个步骤总是相同的

### 具有then方法的鸭子类型
1.  在Promise领域，一个重要的细节是如何确定某个值是不是真正的Promise。或者更直接地说，它是不是一个行为方式类似于Promise的值
    - 既然Promise是通过`new Promise(..)`语法创建的，那你可能就认为可以通过`p instanceof Promise`来检查。但遗憾的是，这并不足以作为检查方法，原因有许多
        - 其中最主要的是，Promise值可能是从其他浏览器窗口（iframe等）接收到的。这个浏览器窗口自己的Promise可能和当前窗口/frame的不同，因此这样的检查无法识别Promise实例
        - 库或框架可能会选择实现自己的Promise，而不是使用原生ES6 Promise实现。实际上，很有可能你是在早期根本没有Promise实现的浏览器中使用由库提供的Promise
    - 因此，识别Promise（或者行为类似于Promise的东西）就是定义某种称为thenable的东西，将其定义为任何具有`then(..)`方法的对象和函数。我们认为，任何这样的值就是Promise一致的thenable
2.  根据一个值的形态（具有哪些属性）对这个值的类型做出一些假定。这种类型检查（typecheck）一般用术语鸭子类型（duck typing）来表示——“如果它看起来像只鸭子，叫起来像只鸭子，那它一定就是只鸭子”。于是，对thenable值的鸭子类型检测就大致类似于
    ```javascript
    if ( 
        p !== null && 
        ( 
            typeof p === "object" || 
            typeof p === "function" 
        ) && 
        typeof p.then === "function" 
    ) { 
        // 假定这是一个thenable! 
    } 
    else { 
        // 不是thenable 
    } 
    ```
    - 除了在多个地方实现这个逻辑有点丑陋之外，其实还有一些更深层次的麻烦
    - 如果你试图使用恰好有`then(..)`函数的一个对象或函数值完成一个Promise，但并不希望它被当作Promise或thenable，那就有点麻烦了，因为它会自动被识别为thenable，并被按照特定的规则处理。即使你并没有意识到这个值有`then(..)`函数也是这样
        ```javascript
        var o = { then: function(){} }; 
        // 让v [[Prototype]]-link到o 
        var v = Object.create( o ); 
        v.someStuff = "cool"; 
        v.otherStuff = "not so cool"; 
        v.hasOwnProperty( "then" ); // false 
        ```
        - v看起来根本不像Promise或thenable。它只是一个具有一些属性的简单对象，但你不知道的是，v还`[[Prototype]]`连接到了另外一个对象o，而后者恰好具有一个`then(..)`属性。所以thenable鸭子类型检测会把v认作一个thenable
    - 甚至不需要是直接有意支持的
        ```javascript
        Object.prototype.then = function(){}; 
        Array.prototype.then = function(){}; 
        var v1 = { hello: "world" }; 
        var v2 = [ "Hello", "World" ];
        ```
        - v1和v2都会被认作thenable。如果有任何其他代码无意或恶意地给`Object.prototype`、`Array.prototype`或任何其他原生原型添加`then(..)`，你无法控制也无法预测
        - 并且，如果指定的是不调用其参数作为回调的函数，那么如果有Promise决议到这样的值，就会永远挂住

### Promise信任问题
1.  Promise解决了所有因控制反转的信任问题
    - 由回调造成的信任问题
        - 调用回调过早
        - 调用回调过晚（或不被调用）
        - 调用回调次数过少或过多
        - 未能传递所需的环境和参数
        - 吞掉可能出现的错误和异常
2.  调用过早
    - 调用过早主要就是担心代码是否会引入类似Zalgo这样的副作用（一个任务有时同步完成，有时异步完成，这可能会导致竞态条件）
    - 根据定义，Promise就不必担心这种问题，因为即使是立即完成的Promise（类似于`new Promise(function(resolve){ resolve(42); })`）也无法被同步观察到。也就是说，对一个Promise调用`then(..)`的时候，即使这个Promise已经决议，提供给`then(..)`的回调也总会被异步调用。不再需要插入你自己的`setTimeout(..,0)`hack，Promise会自动防止Zalgo出现
3.  调用过晚
    - Promise创建对象调用`resolve(..)`或`reject(..)`时，这个Promise的`then(..)`注册的观察回调就会被自动调度。可以确信，这些被调度的回调在下一个异步事件点上一定会被触发。一个Promise决议后，这个Promise上所有的通过`then(..)`注册的回调都会在下一个异步时机点上依次被立即调用。这些回调中的任意一个都无法影响或延误对其他回调的调用
        ```javascript
        p.then( function(){ 
            p.then( function(){ 
                console.log( "C" ); 
            } ); 
            console.log( "A" ); 
        } ); 
        p.then( function(){ 
            console.log( "B" ); 
        } ); 
        // A B C 
        ```
        - 这里，"C"无法打断或抢占"B"，这是因为Promise的运作方式
    - 注意：两个独立Promise上链接的回调的相对顺序无法可靠预测，如果两个promise p1和p2都已经决议，那么`p1.then(..)`;`p2.then(..)`的调用顺序并不是想象的先调用p1的回调，然后是p2的回调
        ```javascript
        var p3 = new Promise( function(resolve,reject){ 
            resolve( "B" ); 
        } ); 
        var p1 = new Promise( function(resolve,reject){ 
            resolve( p3 ); 
        } ); 
        p2 = new Promise( function(resolve,reject){ 
            resolve( "A" ); 
        } ); 
        p1.then( function(v){ 
            console.log( v ); 
        } ); 
        p2.then( function(v){ 
            console.log( v ); 
        } ); 
        // A B <-- 而不是像你可能认为的B A 
        ```
        - 目前你可以看到，p1不是用立即值而是用另一个promise p3决议，后者本身决议为值"B"。规定的行为是把p3展开到p1，但是是异步地展开。所以，在异步任务队列中，p1的回调排在p2的回调之后
        - 要避免这样的细微区别带来的噩梦，你永远都不应该依赖于不同Promise间回调的顺序和调度
4.  回调未调用
    - 首先，没有任何东西（甚至JavaScript错误）能阻止Promise向你通知它的决议（如果它决议了的话）。如果你对一个Promise注册了一个完成回调和一个拒绝回调，那么Promise在决议时总是会调用其中的一个。如果你的回调函数本身包含JavaScript错误，那可能就会看不到你期望的结果，但实际上回调还是被调用了，并且在回调出错时还会得到通知
    - 如果Promise本身永远不被决议，Promise也提供了解决方案，其使用了一种称为竞态的高级抽象机制
        ```javascript
        // 用于超时一个Promise的工具
        function timeoutPromise(delay) { 
            return new Promise( function(resolve,reject){ 
                setTimeout( function(){ 
                    reject( "Timeout!" ); 
                }, delay ); 
            } ); 
        } 
        // 设置foo()超时
        Promise.race( [ 
            foo(), // 试着开始foo() 
            timeoutPromise( 3000 ) // 给它3秒钟
        ] ) 
        .then( 
            function(){ 
                // foo(..)及时完成！
            }, 
            function(err){ 
                // 或者foo()被拒绝，或者只是没能按时完成
                // 查看err来了解是哪种情况
            } 
        ); 
        ```
        - 关于这个Promise超时模式还有更多细节需要考量
        - 很重要的一点是，我们可以保证一个`foo()`有一个输出信号，防止其永久挂住程序
5.  调用次数过少或过多
    - 根据定义，回调被调用的正确次数应该是1。“过少”的情况就是调用0次，和前面解释过的“未被”调用是同一种情况
    - Promise的定义方式使得它只能被决议一次。如果出于某种原因，Promise创建代码试图调用`resolve(..)`或`reject(..)`多次，或者试图两者都调用，那么这个Promise将只会接受第一次决议，并默默地忽略任何后续调用。由于Promise只能被决议一次，所以任何通过`then(..)`注册的（每个）回调就只会被调用一次
    - 当然，如果你把同一个回调注册了不止一次（比如`p.then(f); p.then(f);`），那它被调用的次数就会和注册次数相同
    - 这种机制可以使得在动态请求数据（根据滚动条滑动）时防止多次请求数据，或使用事件监听+`setTimeout`来防止多次响应
6.  未能传递参数/环境值
    - Promise至多只能有一个决议值（完成或拒绝），如果你没有用任何值显式决议，那么这个值就是undefined。不管这个值是什么，无论当前或未来，它都会被传给所有注册的（且适当的完成或拒绝）回调
    - 如果使用多个参数调用`resovle(..)`或者`reject(..)`，第一个参数之后的所有参数都会被默默忽略。这看起来似乎违背了我们前面介绍的保证，但实际上并没有，因为这是对Promise机制的无效使用。对于这组API的其他无效使用（比如多次重复调用`resolve(..)`），也是类似的保护处理，所以这里的Promise行为是一致的。如果要传递多个值，你就必须要把它们封装在单个值中传递，比如通过一个数组或对象
    -  对环境来说，JavaScript中的函数总是保持其定义所在的作用域的闭包，所以它们当然可以继续访问你提供的环境状态。当然，对于只用回调的设计也是这样，因此这并不是Promise特有的优点
7.  吞掉错误或异常
    - 如果拒绝一个Promise并给出一个理由（也就是一个出错消息），这个值就会被传给拒绝回调
    - 如果在Promise的创建过程中或在查看其决议结果过程中的任何时间点上出现了一个JavaScript 异常错误，比如一个TypeError或ReferenceError，那这个异常就会被捕捉，并且会使这个Promise被拒绝
        ```javascript
        var p = new Promise( function(resolve,reject){ 
            foo.bar(); // foo未定义，所以会出错！
            resolve( 42 ); // 永远不会到达这里 :( 
        } ); 
        p.then( 
            function fulfilled(){ 
                // 永远不会到达这里 :( 
            }, 
            function rejected(err){ 
                // err将会是一个TypeError异常对象来自foo.bar()这一行
            } 
        ); 
        ```
        - `foo.bar()`中发生的JavaScript异常导致了Promise拒绝，你可以捕捉并对其作出响应
        - 这是一个重要的细节，因为其有效解决了另外一个潜在的Zalgo风险，即出错可能会引起同步响应，而不出错则会是异步的。Promise甚至把JavaScript异常也变成了异步行为，进而极大降低了竞态条件出现的可能
    - 如果Promise完成后在查看结果时（`then(..)`注册的回调中）出现了JavaScript异常错误会怎样呢？即使这些异常不会被丢弃，但你会发现，对它们的处理方式还是有点出出乎意料
        ```javascript
        var p = new Promise( function(resolve,reject){ 
            resolve( 42 ); 
        } ); 
        p.then( 
            function fulfilled(msg){ 
                foo.bar(); 
                console.log( msg ); // 永远不会到达这里 :( 
            }, 
            function rejected(err){ 
                // 永远也不会到达这里 :( 
            } 
        ); 
        ```
        -  这看起来像是`foo.bar()`产生的异常真的被吞掉了，而实际上`p.then(..)`调用本身返回了另外一个promise，正是这个promise将会因TypeError异常而被拒绝
        - 为什么它不是简单地调用我们定义的错误处理函数呢？这样的话就违背了Promise的一条基本原则，即Promise一旦决议就不可再变。p已经完成为值42，所以之后查看p的决议时，并不能因为出错就把p再变为一个拒绝
        - 此外，假如这个promise p有多个`then(..)`注册的回调的话，有些回调会被调用，而有些则不会，情况会非常不透明，难以解释
8.  是可信任的Promise吗
    - Promise并没有完全摆脱回调。它们只是改变了传递回调的位置。我们并不是把回调传递给`foo(..)`，而是从`foo(..)`得到某个东西（外观上看是一个真正的Promise），然后把回调传给这个东西
    - 在原生ES6 Promise实现中的解决方案——解决确定返回的这个东西实际上就够确定返回的这个东西实际上就，就是`Promise.resolve(..)`
        - 如果向`Promise.resolve(..)`传递一个非Promise、非thenable的立即值，就会得到一个用这个值填充的promise
            ```javascript
            var p1 = new Promise( function(resolve,reject){ 
                resolve( 42 ); 
            } ); 
            var p2 = Promise.resolve( 42 );
            ```
            - promise p1和promise p2的行为是完全一样的
        - 如果向`Promise.resolve(..)`传递一个真正的Promise，就只会返回同一个promise
            ```javascript
            var p1 = Promise.resolve( 42 ); 
            var p2 = Promise.resolve( p1 ); 
            p1 === p2; // true
            ```
        -  如果向`Promise.resolve(..)`传递了一个非Promise的thenable值，前者就会试图展开这个值，而且展开过程会持续到提取出一个具体的非类Promise的最终值
            ```javascript
            var p = { 
                then: function(cb) { 
                    cb( 42 ); 
                } 
            }; 
            // 这可以工作，但只是因为幸运而已
            p 
            .then( 
                function fulfilled(val){ 
                    console.log( val ); // 42 
                }, 
                function rejected(err){ 
                    // 永远不会到达这里
                } 
            ); 
            ```
            - 这个p是一个thenable，但并不是一个真正的Promise。幸运的是，和绝大多数值一样，它是可追踪的
        - 但是，如果得到的是如下这样的值
            ```javascript
            var p = { 
                then: function(cb,errcb) { 
                    cb( 42 ); 
                    errcb( "evil laugh" ); 
                } 
            }; 
            p 
            .then( 
                function fulfilled(val){ 
                    console.log( val ); // 42 
                }, 
                function rejected(err){ 
                    // 啊，不应该运行！
                    console.log( err ); // 邪恶的笑
                } 
            );
            ```
            - 这个p是一个thenable，但是其行为和promise并不完全一致
            - 不管是哪种情况，它都是不可信的
        - 尽管如此，我们还是都可以把这些版本的p传给`Promise.resolve(..)`，然后就会得到期望中的规范化后的安全结果
            ```javascript
            Promise.resolve( p ) 
            .then( 
                function fulfilled(val){ 
                    console.log( val ); // 42 
                }, 
                function rejected(err){ 
                    // 永远不会到达这里
                } 
            ); 
            ```
            - `Promise.resolve(..)`可以接受任何thenable，将其解封为它的非thenable值。从`Promise.resolve(..)`得到的是一个真正的Promise，是一个可以信任的值
        - 假设我们要调用一个工具`foo(..)`，且并不确定得到的返回值是否是一个可信任的行为良好的Promise，但我们可以知道它至少是一个thenable。`Promise.resolve(..)`提供了可信任的Promise封装工具，可以链接使用
            ```javascript
            // 不要只是这么做：
            foo( 42 ) 
            .then( function(v){ 
                console.log( v ); 
            } ); 
            // 而要这么做：
            Promise.resolve( foo( 42 ) ) 
            .then( function(v){ 
                console.log( v ); 
            } ); 
            ```

### 链式流
1.  我们可以把多个Promise连接到一起以表示一系列异步步骤。这种方式可以实现的关键在于以下两个Promise固有行为特性
    - 每次你对Promise调用`then(..)`，它都会创建并返回一个新的Promise，我们可以将其链接起来
    - 不管从`then(..)`调用的完成回调（第一个参数）返回的值是什么，它都会被自动设置为被链接Promise（第一点中的）的完成
        ```javascript
        var p = Promise.resolve( 21 ); 
        var p2 = p.then( function(v){ 
            console.log( v ); // 21 
            // 用值42填充p2
            return v * 2; 
        } ); 
        // 连接p2 
        p2.then( function(v){ 
            console.log( v ); // 42 
        } ); 
        ```
        - 我们通过返回`v * 2`(即42)，完成了第一个调用`then(..)`创建并返回的promise p2。p2的`then(..)`调用在运行时会从`return v * 2`语句接受完成值。当然，`p2.then(..)`又创建了另一个新的promise，可以用变量p3存储
        - 如果必须创建一个临时变量p2（或p3等），还是有一点麻烦的。我们很容易把这些链接到一起
            ```javascript
            var p = Promise.resolve( 21 ); 
            p 
            .then( function(v){ 
                console.log( v ); // 21 
                // 用值42完成连接的promise 
                return v * 2; 
            } ) 
            // 这里是链接的promise 
            .then( function(v){ 
                console.log( v ); // 42 
            } ); 
            ```
            - 现在第一个`then(..)`就是异步序列中的第一步，第二个`then(..)`就是第二步
        - 如果需要步骤2等待步骤1异步来完成一些事情，我们使用了立即返回return语句，这会立即完成链接的promise。使Promise序列真正能够在每一步有异步能力的关键是，传递给`Promise.resolve(..)`的是一个Promise或thenable而不是最终值时的运作方式。`Promise.resolve(..)`会直接返回接收到的真正Promise，或展开接收到的thenable值，并在持续展开thenable的同时递归地前进
        - 从完成（或拒绝）处理函数返回thenable或者Promise的时候也会发生同样的展开
            ```javascript
            var p = Promise.resolve( 21 ); 
            p.then( function(v){ 
                console.log( v ); // 21 
                // 创建一个promise并将其返回
                return new Promise( function(resolve,reject){ 
                // 用值42填充
                resolve( v * 2 ); 
                } ); 
            } ) 
            .then( function(v){ 
                console.log( v ); // 42 
            } );
            ```
            - 虽然我们把42封装到了返回的promise中，但它仍然会被展开并最终成为链接的promise的决议，因此第二个`then(..)`得到的仍然是42
        - 如果我们向封装的promise引入异步，一切都仍然会同样工作
            ```javascript
            var p = Promise.resolve( 21 ); 
            p.then( function(v){ 
                console.log( v ); // 21
                // 创建一个promise并返回
                return new Promise( function(resolve,reject){ 
                    // 引入异步！
                    setTimeout( function(){ 
                        // 用值42填充
                        resolve( v * 2 ); 
                    }, 100 ); 
                } ); 
            } ) 
            .then( function(v){ 
                // 在前一步中的100ms延迟之后运行
                console.log( v ); // 42 
            } );
            ```
            - 现在我们可以构建这样一个序列：不管我们想要多少个异步步骤，每一步都能够根据需要等待下一步（或者不等！）
            - 当然，在这些例子中，一步步传递的值是可选的。如果不显式返回一个值，就会隐式返回undefined，并且这些promise仍然会以同样的方式链接在一起。这样，每个Promise的决议就成了继续下一个步骤的信号
    - 为了进一步阐释链接，让我们把延迟Promise创建（没有决议消息）过程一般化到一个工具中，以便在多个步骤中复用
        ```javascript
        function delay(time) { 
            return new Promise( function(resolve,reject){ 
                setTimeout( resolve, time ); 
            } ); 
        } 
        delay( 100 ) // 步骤1 
        .then( function STEP2(){ 
            console.log( "step 2 (after 100ms)" ); 
            return delay( 200 ); 
        } ) 
        .then( function STEP3(){ 
            console.log( "step 3 (after another 200ms)" ); 
        } ) 
        .then( function STEP4(){ 
            console.log( "step 4 (next Job)" ); 
            return delay( 50 ); 
        } ) 
        .then( function STEP5(){ 
            console.log( "step 5 (after another 50ms)" ); 
        } ) 
        ... 
        ```
        - 调用`delay(200)`创建了一个将在200ms后完成的promise，然后我们从第一个`then(..)`完成回调中返回这个promise，这会导致第二个`then(..)`的promise等待这个200ms的promise
    - 没有消息传递的延迟序列对于Promise流程控制来说并不是一个很有用的示例。我们来考虑如下这样一个更实际的场景
        ```javascript
        // 假定工具ajax( {url}, {callback} )存在
        // Promise-aware ajax 
        function request(url) { 
            return new Promise( function(resolve,reject){ 
                // ajax(..)回调应该是我们这个promise的resolve(..)函数
                ajax( url, resolve ); 
            } ); 
        } 

        request( "http://some.url.1/" ) 
        .then( function(response1){ 
            return request( "http://some.url.2/?v=" + response1 ); 
        } ) 
        .then( function(response2){ 
            console.log( response2 ); 
        } ); 
        ```
        - 我们首先定义一个工具`request(..)`，用来构造一个表示`ajax(..)`调用完成的promise
        - 开发者常会遇到这样的情况：他们想要通过本身并不支持Promise的工具（就像这里的`ajax(..)`，它接收的是一个回调）实现支持Promise的异步流程控制。虽然原生ES6 Promise机制并不会自动为我们提供这个模式，但所有实际的Promise库都会提供。通常它们把这个过程称为“提升”“promise化”或者其他类似的名称
        - 利用返回Promise的`request(..)`，我们通过使用第一个URL调用它来创建链接中的第一步，并且把返回的promise与第一个`then(..)`链接起来
        - response1一返回，我们就使用这个值构造第二个URL，并发出第二个`request(..)`调用。第二个`request(..)`的promise返回，以便异步流控制中的第三步等待这个Ajax调用完成
        - 最后，response2一返回，我们就立即打出结果
        - 我们构建的这个Promise链不仅是一个表达多步异步序列的流程控制，还是一个从一个步骤到下一个步骤传递消息的消息通道
        - 如果这个Promise链中的某个步骤出错了怎么办？错误和异常是基于每个Promise的，这意味着可能在链的任意位置捕捉到这样的错误，而这个捕捉动作在某种程度上就相当于在这一位置将整条链“重置”回了正常运作
            ```javascript
            // 步骤1：
            request( "http://some.url.1/" ) 
            // 步骤2：
            .then( function(response1){ 
                foo.bar(); // undefined，出错！
                // 永远不会到达这里
                return request( "http://some.url.2/?v=" + response1 ); 
            } ) 
            // 步骤3：
            .then( 
                function fulfilled(response2){ 
                // 永远不会到达这里
            }, 
            // 捕捉错误的拒绝处理函数
            function rejected(err){ 
                console.log( err ); 
                // 来自foo.bar()的错误TypeError 
                return 42; 
            } 
            ) 
            // 步骤4：
            .then( function(msg){ 
                console.log( msg ); // 42 
            } ); 
            ```
            - 第2步出错后，第3步的拒绝处理函数会捕捉到这个错误。拒绝处理函数的返回值（这段代码中是42），如果有的话，会用来完成交给下一个步骤（第4步）的promise，这样，这个链现在就回到了完成状态
    - 如果你调用promise的`then(..)`，并且只传入一个完成处理函数，一个默认拒绝处理函数就会顶替上来
        ```javascript
        var p = new Promise( function(resolve,reject){ 
            reject( "Oops" ); 
        } ); 
        var p2 = p.then( 
            function fulfilled(){ 
                // 永远不会达到这里
            } 
            // 假定的拒绝处理函数，如果省略或者传入任何非函数值
            // function(err) { 
            // throw err; 
            // } 
        ); 
        ```
        - 默认拒绝处理函数只是把错误重新抛出，这最终会使得p2（链接的promise）用同样的错误理由拒绝。从本质上说，这使得错误可以继续沿着Promise链传播下去，直到遇到显式定义的拒绝处理函数
    - 如果没有给`then(..)`传递一个适当有效的函数作为完成处理函数参数，还是会有作为替代的一个默认处理函数
        ```javascript
        var p = Promise.resolve( 42 ); 
        p.then( 
            // 假设的完成处理函数，如果省略或者传入任何非函数值
            // function(v) { 
            // return v; 
            // } 
            null, 
            function rejected(err){ 
            // 永远不会到达这里
            } 
        ); 
        ```
        - 你可以看到，默认的完成处理函数只是把接收到的任何传入值传递给下一个步骤（Promise）而已
        - `then(null,function(err){ .. })`这个模式——只处理拒绝（如果有的话），但又把完成值传递下去——有一个缩写形式的API：`catch(function(err){ .. })`
2.  让我们来简单总结一下使链式流程控制可行的Promise固有特性
    - 调用Promise的`then(..)`会自动创建一个新的Promise从调用返回
    - 在完成或拒绝处理函数内部，如果返回一个值或抛出一个异常，新返回的（可链接的）Promise就相应地决议
    - 如果完成或拒绝处理函数返回一个Promise，它将会被展开，这样一来，不管它的决议值是什么，都会成为当前`then(..)`返回的链接Promise的决议值
3.  相对于第2章讨论的回调的一团乱麻，链接的顺序表达已经是一个巨大的进步。但是，仍然有大量的重复样板代码（`then(..)`以及`function({ ... }`）
4.  术语：决议、完成以及拒绝
    ```javascript
    var p = new Promise( function(X,Y){ 
        // X()用于完成
        // Y()用于拒绝
    } );
    ```
    - 提供了两个回调（称为X和Y）。第一个通常用于标识Promise已经完成，第二个总是用于标识Promise被拒绝。通常表明这两个函数还有精确的命名，这会影响开发者对代码的认识
    - 第二个参数名称很容易决定。几乎所有的文献都将其命名为`reject(..)`，因为这就是它真实的（也是唯一的！）工作
    - 但是，第一个参数就有一些模糊了，Promise文献通常将其称为`resolve(..)`。这个词显然和决议（resolution）有关，而决议在各种文献（包括本书）中是用来描述“为Promise设定最终值/状态”。前面我们已经多次使用“Promise决议”来表示完成或拒绝Promise。但是，如果这个参数是用来特指完成这个Promise，那为什么不用使用`fulfill(..)`来代替`resolve(..)`以求表达更精确。原因是：
        ```javascript
        var fulfilledPr = Promise.resolve( 42 ); 
        var rejectedPr = Promise.reject( "Oops" );
        ```
        - `Promise.resolve(..)`创建了一个决议为输入值的Promise。在这个例子中，42是一个非Promise、非thenable的普通值，所以完成后的promise fullfilledPr是为值42创建的。`Promise.reject("Oops")`创建了一个被拒绝的promise rejectedPr，拒绝理由为"Oops"

        ```javascript
        var rejectedTh = { 
            then: function(resolved,rejected) { 
                rejected( "Oops" ); 
            } 
        }; 
        var rejectedPr = Promise.resolve( rejectedTh );
        ```
        - 单词resolve（比如在`Promise.resolve(..)`中）如果用于表达结果可能是完成也可能是拒绝的话，既没有歧义，而且也确实更精确
        - `Promise.resolve(..)`会将传入的真正Promise直接返回，对传入的thenable则会展开。如果这个thenable展开得到一个拒绝状态，那么从`Promise.resolve(..)`返回的Promise实际上就是这同一个拒绝状态
    - `Promise(..)`构造器的第一个参数回调会展开thenable（和`Promise.resolve(..)`一样）或真正的Promise
        ```javascript
        var rejectedPr = new Promise( function(resolve,reject){ 
            // 用一个被拒绝的promise完成这个promise 
            resolve( Promise.reject( "Oops" ) ); 
        } ); 
        rejectedPr.then( 
            function fulfilled(){ 
                // 永远不会到达这里
            }, 
            function rejected(err){ 
                console.log( err ); // "Oops" 
            } 
        );
        ```
        - 如果向`reject(..)`传入一个Promise/thenable值，它会把这个值原封不动地设置为拒绝理由。后续的拒绝处理函数接收到的是你实际传给`reject(..)`的那个Promise/thenable，而不是其底层的立即值
    - 不过，现在我们再来关注一下提供给`then(..)`的回调。它们（在文献和代码中）应该怎么命名呢？我的建议是`fulfilled(..)`和`rejected(..)`
        ```javascript
        function fulfilled(msg) { 
            console.log( msg ); 
        } 
        function rejected(err) { 
            console.error( err ); 
        } 
        p.then( 
            fulfilled, 
            rejected 
        ); 
        ```
        - 对`then(..)`的第一个参数来说，毫无疑义，总是处理完成的情况，所以不需要使用标识两种状态的术语“resolve”
        - ES6规范将这两个回调命名为`onFulfilled(..)`和`onRjected(..)`，所以这两个术语很准确
        
### 错误处理
1.  对多数开发者来说，错误处理最自然的形式就是同步的`try..catch`结构。遗憾的是，它只能是同步的，无法用于异步代码模式
    ```javascript
    function foo() { 
        setTimeout( function(){ 
            baz.bar(); 
        }, 100 ); 
    } 
    try { 
        foo(); 
        // 后面从 `baz.bar()` 抛出全局错误
    } 
    catch (err) { 
        // 永远不会到达这里
    } 
    ```
    - `try..catch`当然很好，但是无法跨异步操作工作。也就是说，还需要一些额外的环境支持
2.  在回调中，一些模式化的错误处理方式已经出现，最值得一提的是`error-first`回调风格
    ```javascript
    function foo(cb) { 
        setTimeout( function(){ 
            try { 
                var x = baz.bar(); 
                cb( null, x ); // 成功！
            } 
            catch (err) { 
                cb( err ); 
            } 
        }, 100 ); 
    } 
    foo( function(err,val){ 
        if (err) { 
            console.error( err ); // 烦 :( 
        } 
        else { 
            console.log( val ); 
        } 
    } ); 
    ```
    - 只有在`baz.bar()`调用会同步地立即成功或失败的情况下，这里的`try..catch`才能工作。如果`baz.bar()`本身有自己的异步完成函数，其中的任何异步错误都将无法捕捉到
    - 传给`foo(..)`的回调函数保留第一个参数err，用于在出错时接收到信号。如果其存在的话，就认为出错；否则就认为是成功
    - 严格说来，这一类错误处理是支持异步的，但完全无法很好地组合。多级error-first回调交织在一起，再加上这些无所不在的if检查语句，都不可避免地导致了回调地狱的风险
3.  Promise中的错误处理，其中拒绝处理函数被传递给`then(..)`。Promise使用了分离回调（split-callback）风格。一个回调用于完成情况，一个回调用于拒绝情况
    ```javascript
    var p = Promise.reject( "Oops" ); 
    p.then( 
        function fulfilled(){ 
            // 永远不会到达这里
        }, 
        function rejected(err){ 
            console.log( err ); // "Oops" 
        } 
    ); 
    ```
    - 彻底掌握Promise错误处理的各种细微差别常常还是有些难度的
        ```javascript
        var p = Promise.resolve( 42 ); 
        p.then( 
            function fulfilled(msg){ 
                // 数字没有string函数，所以会抛出错误
                console.log( msg.toLowerCase() ); 
            }, 
            function rejected(err){ 
                // 永远不会到达这里
            } 
        ); 
        ```
        -  如果`msg.toLowerCase()`合法地抛出一个错误（事实确实如此！），但是错误处理函数没有得到通知。这是因为错误处理函数是为promise p准备的，而这个promise已经用值42填充了。promise p是不可变的，所以唯一可以被通知这个错误的promise是从`p.then(..)`返回的那一个，但我们在此例中没有捕捉
        - Promise的错误处理易于出错。这非常容易造成错误被吞掉，而这极少是出于你的本意
        - 如果通过无效的方式使用Promise API，并且出现一个错误阻碍了正常的Promise构造，那么结果会得到一个立即抛出的异常，而不是一个被拒绝的Promise。这里是一些错误使用导致Promise构造失败的例子：`new Promise(null)`、`Promise.all()`、`Promise.race(42)`，等等
4.  绝望的陷阱
    - Promise错误处理就是一个“绝望的陷阱”设计。默认情况下，它假定你想要Promise状态吞掉所有的错误。如果你忘了查看这个状态，这个错误就会默默地（通常是绝望地）在暗处凋零死掉
    - 为了避免丢失被忽略和抛弃的Promise错误，一些开发者表示，Promise链的一个最佳实践就是最后总以一个`catch(..)`结束，比如
        ```javascript
        var p = Promise.resolve( 42 ); 
        p.then( 
            function fulfilled(msg){ 
                // 数字没有string函数，所以会抛出错误
                console.log( msg.toLowerCase() ); 
            } 
        ) 
        .catch( handleErrors );
        ```
        - 因为我们没有为`then(..)`传入拒绝处理函数，所以默认的处理函数被替换掉了，而这仅仅是把错误传递给了链中的下一个promise。因此，进入p的错误以及p之后进入其决议（就像`msg.toLowerCase()`）的错误都会传递到最后的`handleErrors(..)`
        - 如果`handleErrors(..)`本身内部也有错误怎么办呢？还有一个没人处理的promise：`catch(..)`返回的那一个。我们没有捕获这个promise的结果，也没有为其注册拒绝处理函数。看起来好像是个无解的问题
5.  处理未捕获的情况
    - 有些Promise库增加了一些方法，用于注册一个类似于“全局未处理拒绝”处理函数的东西，这样就不会抛出全局错误，而是调用这个函数。但它们辨识未捕获错误的方法是定义一个某个时长的定时器，比如3秒钟，在拒绝的时刻启动。如果Promise被拒绝，而在定时器触发之前都没有错误处理函数被注册，那它就会假定你不会注册处理函数，进而就是未被捕获错误
    - 在实际使用中，对很多库来说，这种方法运行良好，因为通常多数使用模式在Promise拒绝和检查拒绝结果之间不会有很长的延迟。但是这种模式可能会有些麻烦，因为3秒这个时间太随意了（即使是经验值），也因为确实有一些情况下会需要Promise在一段不确定的时间内保持其拒绝状态。而且你绝对不希望因为这些误报（还没被处理的未捕获错误）而调用未捕获错误处理函数
    - 更常见的一种看法是：Promsie应该添加一个`done(..)`函数，从本质上标识Promsie链的结束。`done(..)`不会创建和返回Promise，所以传递给`done(..)`的回调显然不会报告一个并不存在的链接Promise的问题
        - `done(..)`它的处理方式类似于你可能对未捕获错误通常期望的处理方式：`done(..)`拒绝处理函数内部的任何异常都会被作为一个全局未处理错误抛出（基本上是在开发者终端上）
            ```javascript
            var p = Promise.resolve( 42 ); 
            p.then( 
                function fulfilled(msg){ 
                    // 数字没有string函数，所以会抛出错误
                    console.log( msg.toLowerCase() ); 
                } 
            ) 
            .done( null, handleErrors ); 
            // 如果handleErrors(..)引发了自身的异常，会被全局抛出到这里
            ```
            - 相比没有结束的链接或者任意时长的定时器，这种方案看起来似乎更有吸引力。但最大的问题是，它并不是ES6标准的一部分，所以不管听起来怎么好，要成为可靠的普遍解决方案，它还有很长一段路要走
    - 浏览器有一个特有的功能是我们的代码所没有的：**它们可以跟踪并了解所有对象被丢弃以及被垃圾回收的时机**。所以，浏览器可以追踪Promise对象。如果在它被垃圾回收的时候其中有拒绝，浏览器就能够确保这是一个真正的未捕获错误，进而可以确定应该将其报告到开发者终端
6.  成功的坑
    - 接下来的内容只是理论上的，关于未来的Promise可以变成什么样
        - 默认情况下，如果在这个时间点上该Promise上还没有注册错误处理函数，Promsie在下一个任务或时间循环tick上（向开发者终端）报告所有拒绝
        - 如果想要一个被拒绝的Promise在查看之前的某个时间段内保持被拒绝状态，可以调用`defer()`，这个函数优先级高于该Promise的自动错误报告
    - 如果一个Promise被拒绝的话，默认情况下会向开发者终端报告这个事实（而不是默认为沉默）。可以选择隐式（在拒绝之前注册一个错误处理函数）或者显式（通过`defer()`）禁止这种报告
        ```javascript
        var p = Promise.reject( "Oops" ).defer(); 
        // foo(..)是支持Promise的
        foo( 42 ) 
        .then( 
            function fulfilled(){ 
                return p; 
            }, 
            function rejected(err){ 
                // 处理foo(..)错误
            } 
        ); 
        ...
        ```
        - 创建p的时候，我们知道需要等待一段时间才能使用或查看它的拒绝结果，所以我们就调用`defer()`，这样就不会有全局报告出现。为了便于链接，`defer()`只是返回这同一个promise
        - 从`foo(..)`返回的promise立刻就被关联了一个错误处理函数，所以它也隐式消除了出错全局报告
        - 但是，从`then(..)`调用返回的promise没有调用`defer()`，也没有关联错误处理函数，所以如果它（从内部或决议处理函数）拒绝的话，就会作为一个未捕获错误被报告到开发者终端
        - 这种方案唯一真正的危险是，如果你`defer()`了一个Promise，但之后却没有成功查看或处理它的拒绝结果

### Promise 模式
Promise有链的顺序模式，但是可以基于Promise构建的异步模式抽象还有很多变体
1.  `Promise.all([ .. ])`
    - 在异步序列中（Promise链），任意时刻都只能有一个异步任务正在执行——步骤2只能在步骤1之后，步骤3只能在步骤2之后。但是，如果想要同时执行两个或更多步骤（也就是“并行执行”）
        - 在经典的编程术语中，门（gate）是这样一种机制要等待两个或更多并行/并发的任务都完成才能继续。它们的完成顺序并不重要，但是必须都要完成，门才能打开并让流程控制继续
        - 在Promise API中，这种模式被称为`all([ .. ])`
    - 假定你想要同时发送两个Ajax请求，等它们不管以什么顺序全部完成之后，再发送第三个Ajax请求
        ```javascript
        // request(..)是一个Promise-aware Ajax工具
        // 就像我们在本章前面定义的一样
        var p1 = request( "http://some.url.1/" ); 
        var p2 = request( "http://some.url.2/" ); 
        Promise.all( [p1,p2] ) 
        .then( function(msgs){ 
            // 这里，p1和p2完成并把它们的消息传入
            return request( 
                "http://some.url.3/?v=" + msgs.join(",") 
            ); 
        } ) 
        .then( function(msg){ 
            console.log( msg ); 
        } ); 
        ```
        - `Promise.all([ .. ])`需要一个参数，是一个数组，通常由Promise实例组成。从`Promise.all([ .. ])`调用返回的promise会收到一个完成消息（代码片段中的msg）。这是一个由所有传入promise的完成消息组成的数组，**与指定的顺序一致**（与完成顺序无关）。如果数组是空的，主Promise就会立即完成
    - 从`Promise.all([ .. ])`返回的主promise在且仅在所有的成员promise都完成后才会完成。如果这些promise中有任何一个被拒绝的话，主`Promise.all([ .. ])`promise就会立即被拒绝，并丢弃来自其他所有promise的全部结果
    - 永远要记住为每个promise关联一个拒绝/错误处理函数，特别是从`Promise.all([ .. ])`返回的那一个
2.  `Promise.race([ .. ])`
    - 有时候你会想只响应“第一个跨过终点线的Promise”，而抛弃其他Promise，这种模式传统上称为门闩，但在Promise中称为竞态
    - `Promise.race([ .. ])`也接受单个数组参数。这个数组由一个或多个Promise、thenable或立即值组成。立即值之间的竞争在实践中没有太大意义，因为显然列表中的第一个会获胜，就像赛跑中有一个选手是从终点开始比赛一样
    - 与`Promise.all([ .. ])`不同，一旦有任何一个Promise决议为完成，`Promise.race([ .. ])`就会完成；一旦有任何一个Promise决议为拒绝，它就会拒绝
    - 一项竞赛需要至少一个“参赛者”。所以，如果你传入了一个空数组，主`race([..])`Promise**永远不会决议**，而不是立即决议
    - 这次的p1和p2是竞争关系
        ```javascript
        // request(..)是一个支持Promise的Ajax工具
        // 就像我们在本章前面定义的一样
        var p1 = request( "http://some.url.1/" ); 
        var p2 = request( "http://some.url.2/" ); 
        Promise.race( [p1,p2] ) 
        .then( function(msg){ 
            // p1或者p2将赢得这场竞赛
            return request( 
                "http://some.url.3/?v=" + msg 
            ); 
        } ) 
        .then( function(msg){ 
            console.log( msg ); 
        } ); 
        ```
        - 因为只有一个promise能够取胜，所以完成值是单个消息，而不是像对`Promise.all([ .. ])`那样的是一个数组
    - 超时竞赛
        - 使用`Promise.race([ .. ])`表达Promise超时模式
            ```javascript
            // foo()是一个支持Promise的函数
            // 前面定义的timeoutPromise(..)返回一个promise，
            // 这个promise会在指定延时之后拒绝
            // 为foo()设定超时
            Promise.race( [ 
                foo(), // 启动foo() 
                timeoutPromise( 3000 ) // 给它3秒钟
            ] ) 
            .then( 
                function(){ 
                    // foo(..)按时完成！
                }, 
                function(err){ 
                    // 要么foo()被拒绝，要么只是没能够按时完成，
                    // 因此要查看err了解具体原因
                } 
            ); 
            ```
            - 在多数情况下，这个超时模式能够很好地工作
    - finally
        - 那些被丢弃或忽略的promise通常最终它们会被垃圾回收，Promise不能被取消，也不应该被取消，因为那会与外部不变性原则冲突，所以它们只能被默默忽略
        - 那么如果前面例子中的`foo()`保留了一些要用的资源，但是出现了超时，导致这个promise被忽略，在这种模式中，会有什么为超时后主动释放这些保留资源提供任何支持，或者取消任何可能产生的副作用吗？如果你想要的只是记录下`foo()`超时这个事实，又会如何呢
        - 有些开发者提出，Promise需要一个`finally(..)`回调注册，这个回调在Promise决议后总是会被调用，并且允许你执行任何必要的清理工作。目前，规范还没有支持这一点，不过在ES7+中也许可以，它看起来可能类似于
            ```javascript
            var p = Promise.resolve( 42 ); 
            p.then( something ) 
            .finally( cleanup ) 
            .then( another ) 
            .finally( cleanup );
            ```
            - 在各种各样的Promise库中，`finally(..)`还是会创建并返回一个新的Promise（以支持链接继续）。如果`cleanup(..)`函数要返回一个Promise的话，这个promise就会被连接到链中，这意味着这里还是会有前面讨论过的未处理拒绝问题
        - 同时，我们可以构建一个静态辅助工具来支持查看（而不影响）Promise的决议
            ```javascript
            // polyfill安全的guard检查
            if (!Promise.observe) { 
                Promise.observe = function(pr,cb) { 
                    // 观察pr的决议
                    pr.then( 
                        function fulfilled (msg){ 
                            // 安排异步回调（作为Job）
                            Promise.resolve( msg ).then( cb ); 
                        }, 
                        function rejected(err){ 
                            // 安排异步回调（作为Job）
                            Promise.resolve( err ).then( cb ); 
                        } 
                    ); 
                    // 返回最初的promise 
                    return pr; 
                }; 
            } 

            //// 下面是如何在前面的超时例子中使用这个工具
            Promise.race( [ 
                Promise.observe( 
                    foo(), // 试着运行foo() 
                    function cleanup(msg){ 
                        // 在foo()之后清理，即使它没有在超时之前完成
                    } 
                ), 
                timeoutPromise( 3000 ) // 给它3秒钟
            ] ) 
            ```
            - 这个辅助工具 Promise.observe(..) 只是用来展示可以如何查看 Promise 的完成而不对其产生影响。其他的Promise库有自己的解决方案。不管如何实现，你都很可能遇到需要确保Promise不会被意外默默忽略的情况
    - `all([ .. ])`和`race([ .. ])`的变体
        - `none([ .. ])`
            - 这个模式类似于`all([ .. ])`，不过完成和拒绝的情况互换了。所有的Promise都要被拒绝，即拒绝转化为完成值，反之亦然
        - `any([ .. ])`
            - 这个模式与`all([ .. ])`类似，但是会忽略拒绝，所以只需要完成一个而不是全部
        - `first([ .. ])`
            - 这个模式类似于与`any([ .. ])`的竞争，即只要第一个Promise完成，它就会忽略后续的任何拒绝和完成
        - `last([ .. ])`
            - 这个模式类似于`first([ .. ])`，但却是只有最后一个完成胜出
        - 比如，可以像这样定义`first([ .. ])`
            ```javascript
            // polyfill安全的guard检查
            if (!Promise.first) { 
                Promise.first = function(prs) { 
                    return new Promise( function(resolve,reject){ 
                        // 在所有promise上循环
                        prs.forEach( function(pr){ 
                            // 把值规整化
                            Promise.resolve( pr ) 
                            // 不管哪个最先完成，就决议主promise
                            .then( resolve ); 
                        } ); 
                    } ); 
                }; 
            } 
            ```
            - 在这个`first(..)`实现中，如它的所有promise都拒绝的话，它不会拒绝。它只会挂住，非常类似于`Promise.race([])`。如果需要的话，可以添加额外的逻辑跟踪每个promise拒绝。如果所有的promise都被拒绝，就在主promise上调用`reject()`。可以通过计数，发现每个promise都拒绝后的数量与prs一致，就调用reject
3.  并发迭代
    - 有些时候会需要在一列Promise中迭代，并对所有Promise都执行某个任务，非常类似于对同步数组可以做的那样（比如`forEach(..)`、`map(..)`、`some(..)`和`every(..)`）。如果要对每个Promise执行的任务本身是同步的，那这些工具就可以工作，就像前面代码中的`forEach(..)`
    - 但如果这些任务从根本上是异步的，或者可以/应该并发执行，那你可以使用这些工具的异步版本，许多库中提供了这样的工具
    - 举例来说，让我们考虑一下一个异步的`map(..)`工具。它接收一个数组的值（可以是Promise或其他任何值），外加要在每个值上运行一个函数（任务）作为参数。`map(..)`本身返回一个promise，其完成值是一个数组，该数组（保持映射顺序）保存任务执行之后的异步完成值
        ```javascript
        if (!Promise.map) { 
            Promise.map = function(vals,cb) { 
                // 一个等待所有map的promise的新promise 
                return Promise.all( 
                    // 注：一般数组map(..)把值数组转换为 promise数组
                    vals.map( function(val){ 
                        // 用val异步map之后决议的新promise替换val 
                        return new Promise( function(resolve){ 
                            cb( val, resolve ); 
                        } ); 
                    } ) 
                ); 
            }; 
        }
        ```
        - 在这个`map(..)`实现中，不能发送异步拒绝信号，但如果在映射的回调（`cb(..)`）内出现同步的异常或错误，主`Promise.map(..)`返回的promise就会拒绝
    - 下面展示如何在一组Promise（而非简单的值）上使用`map(..)`
        ```javascript
        var p1 = Promise.resolve( 21 ); 
        var p2 = Promise.resolve( 42 ); 
        var p3 = Promise.reject( "Oops" ); 
        // 把列表中的值加倍，即使是在Promise中
        Promise.map( [p1,p2,p3], function(pr,done){ 
            // 保证这一条本身是一个Promise 
            Promise.resolve( pr ) 
            .then( 
                // 提取值作为v 
                function(v){ 
                    // map完成的v到新值
                    done( v * 2 ); 
                }, 
                // 或者map到promise拒绝消息
                done 
            ); 
        } ) 
        .then( function(vals){ 
            console.log( vals ); // [42,84,"Oops"] 
        } );
        ```

### Promise API概述
1.  `new Promise(..)`构造器
    - 有启示性的构造器`Promise(..)`必须和new一起使用，并且必须提供一个函数回调。这个回调是同步的或立即调用的。这个函数接受两个函数回调，用以支持promise的决议。通常我们把这两个函数称为`resolve(..)`和`reject(..)`
        ```javascript
        var p = new Promise( function(resolve,reject){ 
            // resolve(..)用于决议/完成这个promise
            // reject(..)用于拒绝这个promise
        } ); 
        ```
        - `reject(..)`就是拒绝这个promise；但`resolve(..)`既可能完成promise，也可能拒绝，要根据传入参数而定。如果传给`resolve(..)`的是一个非Promise、非thenable的立即值，这个promise就会用这个值完成
        - 但是，如果传给`resolve(..)`的是一个真正的Promise或thenable值，这个值就会被递归展开，并且（要构造的）promise将取用其最终决议值或状态
2.  `Promise.resolve(..)`和`Promise.reject(..)`
    - 创建一个已被拒绝的Promise的快捷方式是使用`Promise.reject(..)`，所以以下两个promise是等价的
        ```javascript
        var p1 = new Promise( function(resolve,reject){ 
            reject( "Oops" ); 
        } ); 
        var p2 = Promise.reject( "Oops" ); 
        ```
    - `Promise.resolve(..)`常用于创建一个已完成的Promise，使用方式与`Promise.reject(..)`类似。但是，`Promise.resolve(..)`也会展开thenable值。在这种情况下，返回的Promise采用传入的这个thenable的最终决议值，可能是完成，也可能是拒绝
        ```javascript
        var fulfilledTh = { 
            then: function(cb) { cb( 42 ); } 
        }; 
        var rejectedTh = { 
            then: function(cb,errCb) { 
                errCb( "Oops" ); 
            } 
        }; 
        var p1 = Promise.resolve( fulfilledTh ); 
        var p2 = Promise.resolve( rejectedTh ); 
        // p1是完成的promise
        // p2是拒绝的promise
        ```
        - 还要记住，如果传入的是真正的Promise，`Promise.resolve(..)`什么都不会做，只会直接把这个值返回。所以，对你不了解属性的值调用`Promise.resolve(..)`，如果它恰好是一个真正的Promise，是不会有额外的开销的
3.  `then(..)`和`catch(..)`
    - 每个Promise实例（不是Promise API命名空间）都有`then(..)`和`catch(..)`方法，通过这两个方法可以为这个Promise注册完成和拒绝处理函数。Promise决议之后，立即会调用这两个处理函数之一，但不会两个都调用，而且总是异步调用
    - `then(..)`接受一个或两个参数：第一个用于完成回调，第二个用于拒绝回调。如果两者中的任何一个被省略或者作为非函数值传入的话，就会替换为相应的默认回调。默认完成回调只是把消息传递下去，而默认拒绝回调则只是重新抛出（传播）其接收到的出错原因。就像刚刚讨论过的一样，`catch(..)`只接受一个拒绝回调作为参数，并自动替换默认完成回调。换句话说，它等价于`then(null,..)`
        ```javascript
        p.then( fulfilled ); 
        p.then( fulfilled, rejected ); 
        p.catch( rejected ); // 或者p.then( null, rejected ) 
        ```
        - `then(..)`和`catch(..)`也会创建并返回一个新的promise，这个promise可以用于实现Promise链式流程控制。如果完成或拒绝回调中抛出异常，返回的promise是被拒绝的。如果任意一个回调返回非Promise、非thenable的立即值，这个值会被用作返回promise的完成值。如果完成处理函数返回一个promise或thenable，那么这个值会被展开，并作为返回promise的决议值
4.  `Promise.all([ .. ])`和`Promise.race([ .. ])`
    - ES6 Promise API静态辅助函数`Promise.all([ .. ])`和`Promise.race([ .. ])`都会创建一个Promise作为它们的返回值。这个promise的决议完全由传入的promise数组控制
    - 对`Promise.all([ .. ])`来说，只有传入的所有promise都完成，返回promise才能完成。如果有任何promise被拒绝，返回的主promise就立即会被拒绝（抛弃任何其他promise的结果）。如果完成的话，你会得到一个数组，其中包含传入的所有promise的完成值。对于拒绝的情况，你只会得到第一个拒绝promise的拒绝理由值
    - 对`Promise.race([ .. ])`来说，只有第一个决议的promise（完成或拒绝）取胜，并且其决议结果成为返回promise的决议
        ```javascript
        var p1 = Promise.resolve( 42 ); 
        var p2 = Promise.resolve( "Hello World" ); 
        var p3 = Promise.reject( "Oops" ); 
        Promise.race( [p1,p2,p3] ) 
        .then( function(msg){ 
            console.log( msg ); // 42 
        } ); 
        Promise.all( [p1,p2,p3] ) 
        .catch( function(err){ 
            console.error( err ); // "Oops" 
        } ); 
        Promise.all( [p1,p2] ) 
        .then( function(msgs){ 
            console.log( msgs ); // [42,"Hello World"] 
        } ); 
        ```
        - 若向`Promise.all([ .. ])`传入空数组，它会立即完成，但`Promise.race([ .. ])`会挂住，且永远不会决议
### Promise局限性
1.  顺序错误处理
    - Promise的设计局限性（具体来说，就是它们链接的方式）造成了一个让人很容易中招的陷阱，即Promise链中的错误很容易被无意中默默忽略掉
    - 关于Promise错误，还有其他需要考虑的地方。由于一个Promise链仅仅是连接到一起的成员Promise，没有把整个链标识为一个个体的实体，这意味着没有外部方法可以用于观察可能发生的错误。如果构建了一个没有错误处理函数的Promise链，链中任何地方的任何错误都会在链中一直传播下去，直到被查看（通过在某个步骤注册拒绝处理函数）。在这个特定的例子中，只要有一个指向链中最后一个promise的引用就足够了（下面代码中的p），因为你可以在那里注册拒绝处理函数，而且这个处理函数能够得到所有传播过来的错误的通知
        ```javascript
        // foo(..), STEP2(..)以及STEP3(..)都是支持promise的工具
        var p = foo( 42 ) 
        .then( STEP2 ) 
        .then( STEP3 ); 
        ```
        - 这里的p并不指向链中的第一个promise（调用`foo(42)`产生的那一个），而是指向最后一个promise，即来自调用`then(STEP3)`的那一个
        - 还有，这个Promise链中的任何一个步骤都没有显式地处理自身错误。这意味着你可以在p上注册一个拒绝错误处理函数，对于链中任何位置出现的任何错误，这个处理函数都会得到通知`p.catch( handleErrors );`
        - 但是，如果链中的任何一个步骤事实上进行了自身的错误处理（可能以隐藏或抽象的不可见的方式），那你的`handleErrors(..)`就不会得到通知。基本上，这等同于`try..catch`存在的局限：`try..catch`可能捕获一个异常并简单地吞掉它。所以这并不是Promise独有的局限性
    - 很多时候并没有为Promise链序列的中间步骤保留的引用。因此，没有这样的引用，你就无法关联错误处理函数来可靠地检查错误
2.  单一值
    - 根据定义，Promise只能有一个完成值或一个拒绝理由。在简单的例子中，这不是什么问题，但是在更复杂的场景中，你可能就会发现这是一种局限了。一般的建议是构造一个值封装（比如一个对象或数组）来保持这样的多个信息。这个解决方案可以起作用，但要在Promise链中的每一步都进行封装和解封，就十分丑陋和笨重了
        - 分裂值：有时候你可以把这一点当作提示你可以/应该把问题分解为两个或更多Promise的信号
            - 设想你有一个工具 foo(..)，它可以异步产生两个值（x 和 y）
                ```javascript
                function getY(x) { 
                    return new Promise( function(resolve,reject){ 
                        setTimeout( function(){ 
                            resolve( (3 * x) - 1 ); 
                        }, 100 ); 
                    } ); 
                } 
                function foo(bar,baz) { 
                    var x = bar * baz; 
                    return getY( x ) 
                        .then( function(y){ 
                            // 把两个值封装到容器中
                            return [x,y]; 
                        } ); 
                } 
                foo( 10, 20 ) 
                .then( function(msgs){ 
                    var x = msgs[0]; 
                    var y = msgs[1]; 
                    console.log( x, y ); // 200 599 
                } ); 
                ```
            - 首先，我们重新组织一下`foo(..)`返回的内容，这样就不再需要把x和y封装到一个数组值中以通过promise传输。取而代之的是，我们可以把每个值封装到它自己的promise
                ```javascript
                function foo(bar,baz) { 
                    var x = bar * baz; 
                    // 返回两个promise
                    return [ 
                        Promise.resolve( x ), 
                        getY( x ) 
                    ]; 
                } 
                Promise.all( 
                    foo( 10, 20 ) 
                ) 
                .then( function(msgs){ 
                    var x = msgs[0]; 
                    var y = msgs[1]; 
                    console.log( x, y ); 
                } ); 
                ```
                - 一个promise数组真的要优于传递给单个promise的一个值数组吗？从语法的角度来说这算不上是一个改进。但是，这种方法更符合Promise的设计理念。如果以后需要重构代码把对x和y的计算分开，这种方法就简单得多。
        - 展开/传递参数
            - `var x = ..`和`var y = ..`赋值操作仍然是麻烦的开销。我们可以在辅助工具中采用某种函数技巧
                ```javascript
                function spread(fn) { 
                    return Function.apply.bind( fn, null ); 
                } 
                Promise.all( 
                    foo( 10, 20 ) 
                ) 
                .then( 
                    spread( function(x,y){ 
                        console.log( x, y ); // 200 599 
                    } ) 
                ) 
                ```
            - 当然，你可以把这个函数戏法在线化，以避免额外的辅助工具
                ```javascript
                Promise.all( 
                    foo( 10, 20 ) 
                ) 
                .then( Function.apply.bind( 
                    function(x,y){ 
                        console.log( x, y ); // 200 599 
                    }, 
                    null 
                ) ); 
                ```
            - ES6给出了一个更好的答案：解构。数组解构赋值形式看起来是这样的
                ```javascript
                Promise.all( 
                    foo( 10, 20 ) 
                ) 
                .then( function(msgs){ 
                    var [x,y] = msgs; 
                    console.log( x, y ); // 200 599 
                } ); 
                ```
            - 不过最好的是，ES6提供了数组参数解构形式
                ```javascript
                Promise.all( 
                    foo( 10, 20 ) 
                ) 
                .then( function([x,y]){ 
                    console.log( x, y ); // 200 599 
                } ); 
                ```
3.  单决议
    - Promise最本质的一个特征是：Promise只能被决议一次（完成或拒绝）。在许多异步情况中，你只会获取一个值一次，所以这可以工作良好
    - 设想这样一个场景：你可能要启动一系列异步步骤以响应某种可能多次发生的激励（就像是事件），比如按钮点击。这样可能不会按照你的期望工作
        ```javascript
        // click(..)把"click"事件绑定到一个DOM元素
        // request(..)是前面定义的支持Promise的Ajax 
        var p = new Promise( function(resolve,reject){ 
            click( "#mybtn", resolve ); 
        } ); 
        p.then( function(evt){ 
            var btnID = evt.currentTarget.id; 
            return request( "http://some.url.1/?id=" + btnID ); 
        } ) 
        .then( function(text){ 
            console.log( text ); 
        } ); 
        ```
        - 只有在你的应用只需要响应按钮点击一次的情况下，这种方式才能工作。如果这个按钮被点击了第二次的话，promise p已经决议，因此第二个`resolve(..)`调用就会被忽略
    - 因此，你可能需要转化这个范例，为每个事件的发生创建一整个新的Promise链
        ```javascript
        click( "#mybtn", function(evt){ 
            var btnID = evt.currentTarget.id; 
            request( "http://some.url.1/?id=" + btnID ) 
            .then( function(text){ 
                console.log( text ); 
            } ); 
        } ); 
        ```
        - 这种方法可以工作，因为针对这个按钮上的每个"click"事件都会启动一整个新的Promise序列
        - 这个设计在某种程度上破坏了关注点与功能分离（SoC）的思想。你很可能想要把事件处理函数的定义和对事件的响应（那个Promise链）的定义放在代码中的不同位置。如果没有辅助机制的话，在这种模式下很难这样实现
4.  惯性
    - 要在你自己的代码中开始使用Promise的话，一个具体的障碍是，现存的所有代码都还不理解Promise。如果你已经有大量的基于回调的代码，那么保持编码风格不变要简单得多
    - Promise提供了一种不同的范式，因此，编码方式的改变程度从某处的个别差异到某种情况下的截然不同都有可能
    - 考虑如下的类似基于回调的场景
        ```javascript
        function foo(x,y,cb) { 
            ajax( 
                "http://some.url.1/?x=" + x + "&y=" + y, 
                cb 
            ); 
        } 
        foo( 11, 31, function(err,text) { 
            if (err) { 
                console.error( err ); 
            } 
            else { 
                console.log( text ); 
            } 
        } ); 
        ```
    - 如前所述，我们绝对需要一个支持Promise而不是基于回调的Ajax工具，可以称之为`request(..)`。你可以实现自己的版本，就像我们所做的一样。但是，如果不得不为每个基于回调的工具手工定义支持Promise的封装，这样的开销会让你不太可能选择支持Promise的重构
    - Promise没有为这个局限性直接提供答案。多数Promise库确实提供辅助工具，但即使没有库，也可以考虑如下的辅助工具
        ```javascript
        // polyfill安全的guard检查
        if (!Promise.wrap) { 
            Promise.wrap = function(fn) { 
                return function() { 
                    var args = [].slice.call( arguments ); 
                    return new Promise( function(resolve,reject){ 
                        fn.apply( 
                            null, 
                            args.concat( function(err,v){ 
                                if (err) { 
                                    reject( err ); 
                                } 
                                else { 
                                    resolve( v ); 
                                } 
                            } ) 
                        ); 
                    } ); 
                }; 
            }; 
        }
        ```
        - 它接受一个函数，这个函数需要一个error-first风格的回调作为第一个参数，并返回一个新的函数。返回的函数自动创建一个Promise并返回，并替换回调，连接到Promise完成或拒绝
        - 使用方式：
            ```javascript
            var request = Promise.wrap( ajax ); 
            request( "http://some.url.1/" ) 
            .then( .. ) 
            .. 
            ```
            - `Promise.wrap(..)`并不产出Promise。它产出的是一个将产生Promise的函数。在某种意义上，产生Promise的函数可以看作是一个Promise工厂。我提议将其命名为“promisory”（“Promise”+“factory”）
        - 把需要回调的函数封装为支持Promise的函数，这个动作有时被称为“提升”或“Promise工厂化”
        - 于是，`Promise.wrap(ajax)`产生了一个`ajax(..)`promisory，我们称之为`request(..)`。这个promisory为Ajax响应生成Promise
        - 如果所有函数都已经是promisory，我们就不需要自己构造了，所以这个额外的步骤有点可惜。但至少这个封装模式（通常）是重复的，所以我们可以像前面展示的那样把它放入`Promise.wrap(..)`辅助工具，以帮助我们的promise编码
        - 所以，回到前面的例子，我们需要为`ajax(..)`和`foo(..)`都构造一个promisory
            ```javascript
            // 为ajax(..)构造一个promisory
            var request = Promise.wrap( ajax ); 
            // 重构foo(..)，但使其外部成为基于外部回调的，
            // 与目前代码的其他部分保持通用
            // ——只在内部使用 request(..)的promise 
            function foo(x,y,cb) { 
                request( 
                    "http://some.url.1/?x=" + x + "&y=" + y 
                ) 
                .then( 
                    function fulfilled(text){ 
                        cb( null, text ); 
                    }, 
                    cb 
                ); 
            } 
            // 现在，为了这段代码的目的，为foo(..)构造一个 promisory
            var betterFoo = Promise.wrap( foo ); 
            // 并使用这个promisory 
            betterFoo( 11, 31 ) 
            .then( 
                function fulfilled(text){ 
                    console.log( text ); 
                }, 
                function rejected(err){ 
                    console.error( err ); 
                } 
            ); 
            ```
            - 当然，尽管我们在重构`foo(..)`以使用新的`request(..)`promisory，但是也可以使`foo(..)`本身成为一个promisory
                ```javascript
                // 现在foo(..)也是一个promisory，因为它委托了request(..) promisory 
                function foo(x,y) { 
                    return request( 
                        "http://some.url.1/?x=" + x + "&y=" + y 
                    ); 
                } 
                foo( 11, 31 ) 
                .then( .. ) 
                ..
                ```
            - 尽管原生ES6 Promise并没有提供辅助函数用于这样的promisory封装，但多数库都提供了这样的支持，或者你也可以构建自己的辅助函数
5.  无法取消的Promise
    - 一旦创建了一个Promise并为其注册了完成和/或拒绝处理函数，如果出现某种情况使得这个任务悬而未决的话，你也没有办法从外部停止它的进程
    - 考虑前面的Promise超时场景
        ```javascript
        var p = foo( 42 ); 
        Promise.race( [ 
            p, 
            timeoutPromise( 3000 ) 
        ] ) 
        .then( 
            doSomething, 
            handleError 
        ); 
        p.then( function(){ 
            // 即使在超时的情况下也会发生 :( 
        } );
        ```
        - 这个“超时”相对于promise p是外部的，所以p本身还会继续运行，这一点可能并不是我们所期望的
        - 一种选择是侵入式地定义你自己的决议回调
            ```javascript
            var OK = true; 
            var p = foo( 42 ); 
            Promise.race( [ 
                p, 
                timeoutPromise( 3000 ) 
                .catch( function(err){ 
                    OK = false; 
                    throw err; 
                } ) 
            ] ) 
            .then( 
                doSomething, 
                handleError 
            ); 
            p.then( function(){ 
                if (OK) { 
                    // 只在没有超时情况下才会发生 :) 
                } 
            } ); 
            ```
            - 这很丑陋。它可以工作，但是离理想实现还差很远。一般来说，应避免这样的情况
            - 这个解决方案的丑陋应该是一个线索，它提示取消这个功能属于Promise之上更高级的抽象
            - 单独的Promise不应该可取消，但是取消一个可序列是合理的，因为你不会像对待Promise那样把序列作为一个单独的不变值来传送
6.  Promise性能
    - 相比于回调，Promise进行的动作要多一些，这自然意味着它也会稍慢一些
    - Promise使所有一切都成为异步的了，即有一些立即（同步）完成的步骤仍然会延迟到任务的下一步。这意味着一个Promise任务序列可能比完全通过回调连接的同样的任务序列运行得稍慢一点
    - Promise稍慢一些，但是作为交换，你得到的是大量内建的可信任性、对Zalgo的避免以及可组合性


