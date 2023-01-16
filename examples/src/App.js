import './App.css';
import {VroomSDK} from "./lib/vroomSDK.min";

const vroomSDK = new VroomSDK();
console.log(vroomSDK.getTransactionsRemain());
console.log(vroomSDK.dependencies.newWebSocket());
console.log(vroomSDK.getTransactionsRemain());

function App() {
  return (
    <div className="App">
      <header className="App-header flex justify-center items-center">
        <div className="mt-20 text-center">
          <h1 className="text-2xl mb-6">vroomSDK version: {vroomSDK.version}</h1>
        </div>
      </header>
    </div>
  );
}

export default App;
