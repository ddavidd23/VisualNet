import { Link } from 'react-router-dom';

function Layout() {
    return (
        <>
            <nav className="flex items-center justify-between bg-blue-500 p-7 mb-5">
                <div className="flex-1 text-md text-white">
                    <Link to="/" className="block lg:inline-block lg:mt-0 hover:font-bold">
                        Home
                    </Link>
                </div>
                <div className="flex-1 text-md text-white">
                    <h1>
                        VisualNet
                    </h1>
                </div>
            </nav>
            <div className="flex flex-row mt-10 ml-5">
                <Link to="/mlp" class="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                    <img class="object-cover w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg" src="/docs/images/blog/image-4.jpg" alt="" />
                    <div class="flex flex-col justify-between p-4 leading-normal">
                        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Simple MLP</h5>
                        <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">Try your hand at building the best neural network to approximate a function!</p>
                    </div>
                </Link>
            </div>
        </>
    )
}

export default Layout;