# Random Numbers

Adam Tucker

## Task

Use a random number generator which generates a random number 1-5 to
output a random number 1-7. You may not alter the original random number generator.
You may trust its output as being truly random, in the range **[1&ndash;5]**.

## Original Strategy

My original strategy was to run the random number generator many times, using a
cumulative sum, to achieve a random number whose maximum value was **5 &times; 7**.

```
var sum = 0;
for( var i = 0; i < 7; i++)
{
  sum += rand5();
}

Console.Write(sum);
```

This strategy is technically able of returning values 1 - 7, but the distribution
of values is not even across all potential results.

### Results

After running **k** times, the distribution of results is shown below:

```yaml
        #:  name=v
arr:  [0, 0, 0, 0, 0, 0, 0]
arr2: [0, 0, 0, 0, 0, 0, 0]
```

```yaml
   #: jquery=dform
name : k
caption : k&nbsp;&nbsp;
type : number
value : 10000
```

```yaml
         #: name=plotoptions
width: 800px
series:
    bars:
        show: true
        dataLabels: true
grid:
    backgroundColor:
        colors: ["#fff", "#eee"]
```

```js
function rand5() {
  return Math.floor((Math.random() * 5) + 1);
}

for (i = 0; i < k; i++) {
  sum = 0;
  for (j = 0; j < 7; j++) {
    sum += rand5();
  }
  v.arr[Math.floor(sum/5)-1] += 1;
}

x = [1, 2, 3, 4, 5, 6, 7]
plot(x, v.arr, plotoptions)
```

### Problem
Randomness is lost when broken down into small cumulative sums. This is the same
reason that rolling a 12-sided die does not yield the same result as rolling 2
6-sided dice and adding their results.

## Revised Strategy
Instead, we have to use some other mechanism to "stretch" our random range from
**[1&ndash;5]** to **[1&ndash;7]**.

A better way than *cumulative sum* to stretch the range of a random number generator
is to use *multiplication* instead. Where *cumulative sum* will naturally raise the
lowest possible value, *multiplication* will not.

However, we are only able to multiply together multiple instances of **[1&ndash;5]**.
Therefore, our only possible ranges are **[1&ndash;5&#8319;]**.

One strategy we may use is to create a random number generator for **[1-25]**,
filling in numbers **[1-7]** an even number of times, and filling the remaining
positions with zeros. In this way, we can generate 2 random numbers **[1-5]**,
multiply them together, then determine the whether we land on a number **[1-7]**
in our map. If we instead land on a **0**, we simply repeat the procedure until
we land on a valid result.

```csharp
var valueMap = [ [ 1, 2, 3, 4, 5 ],
                 [ 6, 7, 1, 2, 3 ],
                 [ 4, 5, 6, 7, 1 ],
                 [ 2, 3, 4, 5, 6 ],
                 [ 7, 0, 0, 0, 0 ] ];

var value = 0;

while (value == 0)
{
  value = valueMap[rand5() - 1][rand5() - 1];
}

Console.Write(value);
```

Technically, this means that the procedure could go on-and-on forever, as there
is a 16% chance of needing to repeat each time. However, the chance of repeating
**n** times is **0.16&#8319;**.

### Chance of Long Runtimes

```yaml
   #: jquery=dform
name : n
caption : n&nbsp;&nbsp;
type : number
value : 4
```

```js
  #: output=markdown
println("Chance of repeating **" + n + "** times: **" + Math.pow(0.16,n) + "**")
```

### Results

After running **k&prime;** times, the distribution of results is shown below:

```yaml
        #:  name=m
vals: [ [ 1, 2, 3, 4, 5 ],
        [ 6, 7, 1, 2, 3 ],
        [ 4, 5, 6, 7, 1 ],
        [ 2, 3, 4, 5, 6 ],
        [ 7, 0, 0, 0, 0 ] ]
```

```yaml
   #: jquery=dform
name : p
caption : k&prime;&nbsp;&nbsp;
type : number
value : 10000
```

```js
function rand5() {
  return Math.floor((Math.random() * 5) + 1);
}

for (i = 0; i < p; i++) {
  val = 0;

  while (val == 0) {
    val = m.vals[rand5()-1][rand5()-1];
  }

  v.arr2[val-1] += 1;
}

x = [1, 2, 3, 4, 5, 6, 7]
plot(x, v.arr2, plotoptions)
```

<br />
That's more like it!

## Conclusion
Use of cumulative sums distort randomness of the elements being added. If multiplication
is used instead, randomness may be preserved, but at the potential cost of runtime.
