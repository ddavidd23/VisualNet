import { Link } from 'react-router-dom';

function Layout() {
    return (
        <nav>
            <ul>
                <li>
                    <Link to="/test">Test</Link>
                </li>
                <li>
                    <Link to="/mlp">MLP</Link>
                </li>
            </ul>
        </nav>
    )
}

export default Layout;