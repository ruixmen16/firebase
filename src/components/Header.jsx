// src/components/Header.jsx
import React from 'react';
import NavigationBar from './NavigationBar';

const Header = ({ user, onSignOut }) => {
    return (
        <div>
            <NavigationBar user={user} handleSignOut={onSignOut} />
        </div>
    );
};

export default Header;