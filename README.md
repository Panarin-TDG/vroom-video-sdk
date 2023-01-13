# vroom-video-sdk #

## Installation
```
yarn add vroom-video-sdk
```

```javascript
import './App.css';
import vroomSDK from "./lib/vroomSDK.min";

function App() {
  return (
    <div className="App">
      <header className="App-header flex justify-center items-center">
        <div className="mt-20 text-center">
          <h1 className="text-2xl mb-6">vroomSDK version: {vroomSDK.version()}</h1>
        </div>
      </header>
    </div>
  );
}

export default App;
```

## Contribute Installation ##
```
git clone git@github.com:Panarin-TDG/vroom-video-sdk.git

cd vroom-video-sdk

yarn install

yarn build

cd examples

npm install

npm run start
```

Dev URL. http://localhost:3000
