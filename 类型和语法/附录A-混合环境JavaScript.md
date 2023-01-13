<!--
 * @Author: jiaminghui
 * @Date: 2023-01-09 21:46:54
 * @LastEditTime: 2023-01-13 21:05:14
 * @LastEditors: jiaminghui
 * @FilePath: \JavaScript_Learn\类型和语法\附录A-混合环境JavaScript.md
 * @Description: 
-->
# 混合环境JavaScript学习
如果JavaScript程序仅仅是在引擎中运行的话，它会严格遵循规范并且是可以预测的。但是**JavaScript程序几乎总是在宿主环境中运行**，这使得它在一定程度上变得不可预测。当你的代码和其他第三方代码一起运行，或者当你的代码在不同的JavaScript引擎（并非仅仅是浏览器）上运行时，有些地方就会出现差异

## Annex B（ECMAScript）
1.  JavaScript语言的官方名称是ECMAScript（指的是管理它的ECMA标准）。JavaScript是该语言的通用称谓，更确切地说，它是该规范在浏览器上的实现
2.  官方ECMAScript规范包括Annex B，其中介绍了由于浏览器兼容性问题导致的与官方规范的差异。这些差异只存在于浏览器中。如果代码只在浏览器中运行，就不会发现任何差异。否则（如果代码也在Node.js、Rhino等环境中运行）就需要小心对待
3.  主要的兼容性差异
    - 在非严格模式中允许八进制数值常量存在，如0123（即十进制的83）
    - `window.escape(..)`和`window.unescape(..)`让你能够转义（escape）和回转（unescape）带有%分隔符的十六进制字符串。例如，`window.escape( "? foo=97%&bar=3%" )`的结果为`"%3Ffoo%3D97%25%26bar%3D3%25"`
    - `String.prototype.substr`和`String.prototype.substring`十分相似，除了前者的第二个参数是结束位置索引（非自包含），后者的第二个参数是长度（需要包含的字符数）
4.  Web ECMAScript规范中介绍了官方ECMAScript规范和目前基于浏览器的JavaScript实现之间的差异，其中的内容对浏览器来说是“必需的”（考虑到兼容性），但是并未包含在官方规范的“Annex B”部分
    - `<!-- 和 -->`是合法的单行注释分隔符
    - `String.prototype`中返回HTML格式字符串的附加方法：`anchor(..)`、`big(..)`、`blink(..)`、`bold(..)`、`fixed(..)`、`fontcolor(..)`、`fontsize(..)`、`italics(..)`、`link(..)`、`small(..)`、`strike(..)`和`sub(..)`
    - RegExp扩展：`RegExp.$1 .. RegExp.$9`（匹配组）和`RegExp.lastMatch/RegExp["$&"]`（最近匹配）
    - `Function.prototype`附加方法：`Function.prototype.arguments`（别名为arguments对象）和`Function.caller`（别名为arguments.caller）
5.  通常来说，出现这些差异的情况很少，所以无需特别担心。只要在使用它们的时候特别注意即可

## 宿主对象
1.  JavaScript中有关变量的规则定义得十分清楚，但也不乏一些例外情况，比如自动定义的变量，以及由宿主环境（浏览器等）创建并提供给JavaScript引擎的变量——所谓的“宿主对象”（包括内建对象和函数）
    ```javascript
    var a = document.createElement( "div" );
    typeof a; // "object"--正如所料
    Object.prototype.toString.call( a ); // "[object HTMLDivElement]"
    a.tagName; // "DIV"
    ```
    - a不仅仅是一个object，还是一个特殊的宿主对象，因为它是一个DOM元素。其内部的`[[Class]]`值（为"HTMLDivElement"）来自预定义的属性（通常也是不可更改的）
2.  其他需要注意的宿主对象的行为差异有
    - 无法访问正常的object内建方法，如`toString()`
    - 无法写覆盖
    - 包含一些预定义的只读属性
    - 包含无法将this重载为其他对象的方法
    - 其他……
3.  在针对运行环境进行编码时，宿主对象扮演着一个十分关键的角色，但要特别注意其行为特性，因为它们常常有别于普通的JavaScript object
    - 例如宿主对象console及其各种方法（`log(..)`、`error(..)`等）是比较值得一提的。console对象由宿主环境提供，以便从代码中输出各种值
    - console在浏览器中是输出到开发工具控制台，而在Node.js和其他服务器端JavaScript环境中，则是指向JavaScript环境系统进程的标准输出（stdout）和标准错误输出（stderr）

## 全局DOM变量
1.  声明一个全局变量（使用var或者不使用）的结果并不仅仅是创建一个全局变量，而且还会在global对象（在浏览器中为window）中创建一个同名属性
2.  在创建带有id属性的DOM元素时也会创建同名的全局变量
    ```javascript
    <div id="foo"></div>
    if (typeof foo == "undefined") {
        foo = 42; // 永远也不会运行
    }
    console.log( foo ); // HTML元素
    ```
    - 你可能认为只有JavaScript代码才能创建全局变量，并且习惯使用`typeof`或`.. in window`来检测全局变量。但是如上例所示，HTML页面中的内容也会产生全局变量，并且稍不注意就很容易让全局变量检查错误百出

## 原生原型
1.  一个广为人知的JavaScript的最佳实践是：不要扩展原生原型。如果向`Array.prototype`中加入新的方法和属性，假设它们确实有用，设计和命名都很得当，那它最后很有可能会被加入到JavaScript规范当中。这样一来你所做的扩展就会与之冲突
    ```javascript
    // Netscape 4没有Array.push
    Array.prototype.push = function(item) {
        this[this.length] = item;
    };
    ```
    - 代码没有问题，但是`Array.prototype.push`随后被加入到了规范中，并且和这段代码不兼容。标准的`push(..)`可以一次加入多个值
2.  在扩展原生方法时需要加入判断条件（因为你可能无意中覆盖了原来的方法）
    ```javascript
    if (!Array.prototype.push) {
        // Netscape 4没有Array.push
        Array.prototype.push = function(item) {
            this[this.length] = item;
        };
    }
    ```
    - 其中，if语句用来确保当JavaScript运行环境中没有`push()`方法时才将扩展加入
3.  通常来说，在老版本的（不符合规范的）运行环境中扩展原生方法是唯一安全的，因为环境不太可能发生变化
    ```javascript
    if (!Array.prototype.foobar) {
        // 幼稚
        Array.prototype.foobar = function() {
            this.push( "foo", "bar" );
        }; 
    }
    ```
    - 如果规范中已经定义了`Array.prototype.foobar`，并且其功能和上面的代码类似，那就没有什么问题。这种情况一般称为polyfill
    - polyfill能有效地为不符合最新规范的老版本浏览器填补缺失的功能，让你能够通过可靠的代码来支持所有你想要支持的运行环境
4.  对于将来可能成为标准的功能，按照大部分人赞同的方式来预先实现能和将来的标准兼容的polyfill，我们称为prollyfill（probably fill）

## `<script>`
1.  绝大部分网站/Web应用程序的代码都存放在多个文件中，通常可以在网页中使用`<script src=..></script>`来加载这些文件，或者使用`<script> .. </script>`来包含内联代码（inline-code）
    - 这些文件和内联代码是相互独立的JavaScript程序，但它们共享global对象（在浏览器中则是window），也就是说这些文件中的代码在共享的命名空间中运行，并相互交互。如果某个script中定义了函数`foo()`，后面的script代码就可以访问并调用`foo()`
    - 但是全局变量作用域的提升机制在这些边界中不适用，因此无论是`<script> .. </script>`还是`<script src=..></script>`，下面的代码都无法运行（因为`foo()`还未被声明）
        ```javascript
        <script>foo();</script>
        <script>
            function foo() { .. }
        </script>
        ```
    - 而下面两段代码没有问题
        ```javascript
        <script>
            foo();
            function foo() { .. }
        </script>

        <script>
            function foo() { .. }
        </script>
        <script>foo();</script>
        ```
    - 如果script中的代码（无论是内联代码还是外部代码）发生错误，它会像独立的JavaScript程序那样停止，但是后续的script中的代码（仍然共享global）依然会接着运行，不会受影响
2.  你可以使用代码来动态创建script，将其加入到页面的DOM中，效果是一样的
    ```javascript
    var greeting = "Hello World";
    var el = document.createElement( "script" );
    el.text = "function foo(){ alert( greeting );\
        } setTimeout( foo, 1000 );";
    document.body.appendChild( el );
    ```
    - 如果将`el.src`的值设置为一个文件URL，就可以通过`<script src=..></script>`动态加载外部文件
3.  内联代码和外部文件中的代码之间有一个区别，即在内联代码中不可以出现`</script>`字符串，一旦出现即被视为代码块结束
    ```javascript
    <script>
        var code = "<script>alert( 'Hello World' )</script>";
    </script>
    ```
    - 字符串常量中的`</script>`将会被当作结束标签来处理，因此会导致错误。常用的变通方法是：`"</sc" + "ript>";`
4.  另外需要注意的一点是，我们是根据代码文件的字符集属性（UTF-8、ISO-8859-8 等）来解析外部文件中的代码（或者默认字符集），而内联代码则使用其所在页面文件的字符集（或者默认字符集）
    - 内联代码的script标签没有charset属性
5.  script标签的一个已废止的用法是在内联代码中包含HTML或XHTML格式的注释，如
    ```javascript
    <script>
        <!--
        alert( "Hello" );
        //-->
    </script>
    <script>
        <!--//--><![CDATA[//><!--
        alert( "World" );
        //--><!]]>
    </script>
    ```

## 保留字
1.  ES5规范在7.6.1节中定义了一些“保留字”，我们不能将它们用作变量名。这些保留字有四类：“关键字”、“预留关键字”、null常量和true/false布尔常量
    - 像function和switch都是关键字
    - 预留关键字包括enum等，它们中很多已经在ES6中被用到（如class、extend等）。另外还有一些在严格模式中使用的保留字，如interface
2.  例如，下面的情况是不允许的
    ```javascript
    var import = "42";
    // 需要转换为：
    var obj = { import: "42" };
    console.log( obj.import );
    ```
    - 在一些版本较老的浏览器中，有时候将保留字作为对象属性还是会出错

## 实现中的限制
1.  JavaScript规范对于函数中参数的个数，以及字符串常量的长度等并没有限制；但是由于JavaScript引擎实现各异，规范在某些地方有一些限制
    ```javascript
    function addAll() {
        var sum = 0;
        for (var i=0; i < arguments.length; i++) {
            sum += arguments[i];
        }
        return sum;
    }
    var nums = [];
    for (var i=1; i < 100000; i++) {
        nums.push(i);
    }
    addAll( 2, 4, 6 ); // 12
    addAll.apply( null, nums ); // 应该是: 499950000
    ```
    - 在一些JavaScript引擎中你会得到正确答案499950000，而另外一些引擎（如Safari 6.x）中则会产生错误“RangeError: Maximum call stack size exceeded”
    - 下面列出一些已知的限制
        - 字符串常量中允许的最大字符数（并非只是针对字符串值）
        - 可以作为参数传递到函数中的数据大小（也称为栈大小，以字节为单位）
        - 函数声明中的参数个数
        - 未经优化的调用栈（例如递归）的最大层数，即函数调用链的最大长度
        - JavaScript程序以阻塞方式在浏览器中运行的最长时间（秒）
        - 变量名的最大长度
    - 我们不会经常碰到这些限制，但应该对它们有所了解，特别是不同的JavaScript引擎的限制各异




