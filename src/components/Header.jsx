// src/components/Header.jsx
import React from 'react';
import NavigationBar from './NavigationBar';
import TabNavigation from './TabNavigation';

const Header = ({ user, handleSignOut, activeTab, setActiveTab }) => {
    return (
        <div>
            <NavigationBar user={user} handleSignOut={handleSignOut} />
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};

export default Header;