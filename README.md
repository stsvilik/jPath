Can't get deeper than jPath does
---
Well folks, JPath came about the same time I got pissed-off at heavily nested JSON objects.
It was both lengthy and unreadable to write a whole line of "If" checks just to get data
nested 4 levels deep inside a JSON object.

JPath is a traverse tool that allows XPATH-like navigation within a
JSON structure and a little more. JPath also uses pattern syntax more familiar to JavaScript developers in the sense
that instead of "/" to navigate nodes I would use "." (dot) notation.

#### How does it work?

jPath is basically a recursive traverser that evaluates an expression you provide and finds each piece of data you
specify one step (recursion) at a time.

#### Does it support conditions?

Just like XPATH, it does support conditional filtering, where you basically specify what nodes you want to retrieve
based on certain condition. Conditional queries work by comparing data members to value you provide inside your
expression (it does not do comparing between data members). So for example if you have an array of objects and you want
to get only those objects where member foo = 1, you would write "obj[foo == 1]", more examples later. It supports a
wide range of evaluations.

- "==" | "=" - compares data member for equality
- "!=" - compares data member inequality
- "<" - less than
- ">" - greater than
- "<=" - less or equal
- ">=" - greater or equal
- "~=" - equal ignoring case
- "^=" - starts with
- "$=" - ends with
- "*=" - contains a string anywhere inside (case insensitive)
- "?" - allows you to pass a custom evaluation function (runs in the scope of evaluated object so you can compare against other object members).

During the comparing stage, all values are type matched (coerced) to the types of values you're comparing against.
What this means is that you always compare numbers against numbers and not strings, and same goes for every other data
type.

If your value contains a space, you can enclose your value in single or double quotes. (i.e. [foo == 'hello world']) Normally you
don't have to do that. If youre value contains quotes, you can escape them using double slashes (i.e [foo == 'Bob\\\'s']).

#### What else can it do?

One thing to note is that there is a special "*" selector that references an object itself, so you may use it lets say
against an array of objects (i.e. *[ foo == bah] - will return rows where member foo has value bah). You can also have
"deep" value comparing (i.e. obj[ foo.bah == "wow"] ). Now that you can do deep value comparing, you can also check for
native properties such as "length" (i.e. obj( [ name.length > 3 ]) ).

API
---
#### Classes:

JPath
- constructor( json ) - initializes JPath instance
- data - local copy of json object you passed in during init.
- selection - cached result of the selection
- from( json ) - this method allows you to change json source
- first() - returns the first result value
- last() - returns the last result value
- eq( index ) - returns result value by index
- select( pattern [, custom_compare_function ]) - performs recursive search
- and( pattern ) - this method allows combining of multiple search results.
- val() - <Array> returns the final value of selection

#### Methods

select( json, expression [,cust_compare_fn] ) - performs a traversal and returns you an instance of JPath object
filter( json, expression [,cust_compare_fn] ) - performs a traversal and returns a value

#### Examples

1. Using Custom compare logic

        jPath.filter( JSON, "foo[bar ? test]", function(left, right) {
            //left - is the value of the data member bar inside foo
            //right - would be equal to "test"
            return left + "blah" == right; //Cusom validation
        });

2. Joining multiple filtering results

        jPath.select( JSON, "foo[bar == 1]").and( "foo2[bar == 2]").val(); //This example adds to the selection a different pattern evaluation

    //Example above could also be written like so:

        jPath.select( JSON, "foo[bar == 1 && bar == 2]").val();

3. If we want to combine results from different JSON objects, than we would do something like so:

        jPath.select( JSON, "foo[bar == 1]").from(JSON2).and( "foo2[bar == 2]").val(); //from() sets a different source of data

4. Accessing array elements by index

        jPath.select({myArray:[1,2,3,4,5]}, "myArray(0)");

5. Using parenteces to group logic

    //Using logical groups is valid and evaluated properly
        jPath.filter(obj, "*[(a==b || a == c) && c == d]");

#### Unit Test
Please find included test.html - it's a QUnit test to validate most of the possible test scenarios.
