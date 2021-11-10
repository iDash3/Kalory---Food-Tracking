import "./App.css";

import { useCallback, useEffect, useState } from "react";
import Quagga from "quagga";

const Scanner = ({ onDetect }) => {
  const handleInit = useCallback(() => {
    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#camera"), // Or '#yourElement' (optional)
        },
        numOfWorkers: 0,
        locate: true,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment",
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
        },
      },
      function (err) {
        if (err) {
          console.log(err);
          return;
        }

        console.log("Initialization finished. Ready to start");
        Quagga.start();
      }
    );

    console.log("New Effect");
  }, []);

  useEffect(() => {
    handleInit();
  }, [handleInit]);

  return null;
};

const AppButton = ({ title, ...otherProps }) => {
  return (
    <button
      style={{
        width: "100px",
        height: "30px",
        fontSize: 15,
        color: "#f8f8ff",
        backgroundColor: "#212121",
      }}
      {...otherProps}
    >
      {title}
    </button>
  );
};

function App() {
  const [power, setPower] = useState(true);
  const [res, setRes] = useState([]);
  const [count, setCount] = useState({});
  const [max, setMax] = useState();
  const [content, setContent] = useState();

  Quagga.onDetected(function (result) {
    var cod = result.codeResult.code;
    console.log(cod);
    _handleDetect(cod);
  });

  const startCamera = () => {};
  const closeCamera = () => {
    Quagga.stop();
  };

  const _handleDetect = (code) => {
    res.push(code);
    // setRes(new Set(res));
    setRes(
      res.filter((c, index) => {
        return res.indexOf(c) === index;
      })
    );

    let counts = count;
    for (const num of res) {
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    setCount(counts);

    let max_res = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
    setMax(max_res);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div id="camera"></div>
        {power && <Scanner onDetect={_handleDetect} />}
        <AppButton
          title={power ? "Turn off" : "Turn on "}
          onClick={() => {
            setPower(!power);
            if (!power) startCamera();
            else closeCamera();
          }}
        ></AppButton>
        <span>{max}</span>
        <AppButton
          title="Go"
          onClick={async () => {
            let url = `https://world.openfoodfacts.org/api/v0/product/${max}.json`;
            const response = await fetch(url);
            if (response.ok) {
              let json = await response.json();
              if (json.status_verbose === "product found") {
                let jsonRef = json.product;
                setContent(
                  `${jsonRef.product_name} \n ${jsonRef.nutrition_data_per} \n ${jsonRef.nutriments["energy-kcal_100g"]}kcal`
                );
                console.log(json);
              } else {
                alert("Product not found!");
              }

              setMax();
              setRes([]);
              setCount({});
            }
          }}
        ></AppButton>
        <p>{content}</p>
      </header>
    </div>
  );
}

export default App;
