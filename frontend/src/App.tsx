import React from 'react'
import { Outlet } from 'react-router-dom' 
import Header from './compoents/Header'
import ContextProvider from './context/ContextProvider'
const App = () => {


  
  return (
    <ContextProvider>
          <Header/>
          <div className="col-sm-12">

        <Outlet />
          </div>
    </ContextProvider>
  )
}

export default App

// import React from 'react';
// import { TaskProvider } from './context/Task.context';
// import AddTask from './pages/Dashboard/components/AddTask';
// import AllTask from './pages/Dashboard/components/AllTask';

// const App = () => {
//     return (
//         <TaskProvider>
//             <div className="container">
//                 <AddTask />
//                 <AllTask />
//             </div>
//         </TaskProvider>
//     );
// };

// export default App;
