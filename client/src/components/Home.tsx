import { Link } from "react-router-dom";
import JoinSession from "./JoinSession";

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-white mb-6 sm:mb-8">
        Welcome to Where2Eat
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 text-center">
            Create New Session
          </h2>
          <Link
            to="/create"
            className="block w-full bg-green-500 text-white text-center py-3 px-4 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            Create Session
          </Link>
        </div>

        <div>
          <JoinSession />
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8 md:hidden">
        Swipe up to see more options
      </div>
    </div>
  );
};

export default Home;
