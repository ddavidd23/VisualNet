import { Link } from 'react-router-dom';
import simpleMLPThumbnail from '../img/simple_mlp_thumbnail.png';
import MNISTThumbnail from '../img/mnist_thumbnail.png';

const PAGES = [
    {
        title: "Simple MLP",
        description: "Try your hand at building the best neural network to approximate a function!",
        link: "/mlp",
        imgLink: simpleMLPThumbnail
    },
    {
        title: "MNIST Classification",
        description: "Build a neural network to classify over the classic MNIST dataset",
        link: "/mnist",
        imgLink: MNISTThumbnail
    }
]

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
            <div className="flex flex-row mt-3">
                {PAGES.map((page) => (
                    <div className="flex flex-row mt-10 ml-5" key={page.link}>
                        <Link to={page.link} className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"> 
                            <img className="object-cover scale-75 w-full rounded-t-lg h-96 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg" src={page.imgLink} alt={page.title} />
                            <div className="flex flex-col justify-between p-4 leading-normal">
                                <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{page.title}</h5>
                                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">{page.description}</p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </>
    );
}

export default Layout;
