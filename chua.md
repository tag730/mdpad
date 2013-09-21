```yaml script=scriptloader
- chua.js
```

```yaml script=dataloader
xml: chua.xml 
```


# OpenModelica simulation example
## Modelica.Electrical.Analog.Examples.ChuaCircuit


<img src=chua.svg style="float:right; width:600px; background-color:#ffffff; border:2px solid gray" />

```yaml js=jsonForm name=frm
schema: 
  stopTime:
    type: string
    title: Stop time, sec
    default: 10000.0
  intervals:
    type: string
    title: Output intervals
    default: 500
  tolerance:
    type: string
    title: Tolerance
    default: 0.0001
  solver: 
    type: string
    title: Solver
    enum: 
      - dassl
      - euler
      - rungekutta
      - dasslwort
      - dassltest
  L: 
    type: string
    title: L (henries)
    default: 18.0
  C1: 
    type: string
    title: C1 (farads)
    default: 10.0
  C2: 
    type: string
    title: C2 (farads)
    default: 100.0
form: 
  - "*"
```

```js
$xml = $(xml)

// Set the default simulation parameters
defex = $xml.find("DefaultExperiment")
defex.attr("stopTime", stopTime)
defex.attr("stepSize", +stopTime / intervals)
defex.attr("tolerance", tolerance)
defex.attr("solver", solver)

// Set some model parameters
$xml.find("ScalarVariable[name = 'L.L']").find("Real").attr("start", L)
$xml.find("ScalarVariable[name = 'C1.C']").find("Real").attr("start", C1)
$xml.find("ScalarVariable[name = 'C2.C']").find("Real").attr("start", C2)

// Write out the initialization file
xmlstring = new XMLSerializer().serializeToString(xml)
Module['FS_createDataFile']('/', 'Modelica.Electrical.Analog.Examples.ChuaCircuit_init.xml', xmlstring, true, true)

// Run the simulation!
run()

// delete the input file
FS.unlink('/Modelica.Electrical.Analog.Examples.ChuaCircuit_init.xml')
```

## Results

```js
// read the csv file with the simulation results
csv = intArrayToString(FS.findObject("Modelica.Electrical.Analog.Examples.ChuaCircuit_res.csv").contents)
x = $.csv.toArrays(csv, {onParseValue: $.csv.hooks.castToScalar})

// `header` has the column names. The first is the time, and the rest
// of the columns are the variables.
header = x.slice(0,1)[0].slice(1)

// Select graph variables with a select box based on the header values
if (typeof(graphvar) == "undefined") graphvar = header[0];

var jsonform = {
  schema: {
    graphvar: {
      type: "string",
      title: "Plot variable",
      default: graphvar,
      enum: header
    }
  },
  form: [
    {
      key: "graphvar",
      onChange: function (evt) {
        calculate_forms();
        $("#plotdiv").calculate();
      }
    }
  ]
};

$active_element.jsonForm(jsonform);
```

```js id=plotdiv
idx = header.indexOf(graphvar) + 1;

// pick out the column to plot
series = x.slice(1).map(function(x) {return [x[0], x[idx]];});

plot([series]);
```