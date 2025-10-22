// src/components/TabNavigation.jsx
import React from 'react';
import { Nav, Container } from 'react-bootstrap';

const TabNavigation = ({ activeTab, setActiveTab }) => {
    return (
        <div className="w-100 bg-light border-bottom shadow-sm">
            <Container>
                <Nav variant="tabs" className="border-0">
                    <Nav.Item className="flex-fill">
                        <Nav.Link
                            active={activeTab === 'chat'}
                            onClick={() => setActiveTab('chat')}
                            className="text-center py-3 fw-semibold border-0"
                            style={{
                                cursor: 'pointer',
                                backgroundColor: activeTab === 'chat' ? '#0d6efd' : 'transparent',
                                color: activeTab === 'chat' ? 'white' : '#495057',
                                borderRadius: '0'
                            }}
                        >
                            💬 Chat Familiar
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item className="flex-fill">
                        <Nav.Link
                            active={activeTab === 'dashboard'}
                            onClick={() => setActiveTab('dashboard')}
                            className="text-center py-3 fw-semibold border-0"
                            style={{
                                cursor: 'pointer',
                                backgroundColor: activeTab === 'dashboard' ? '#0d6efd' : 'transparent',
                                color: activeTab === 'dashboard' ? 'white' : '#495057',
                                borderRadius: '0'
                            }}
                        >
                            📊 Dashboard Electoral
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </Container>
        </div>
    );
};

export default TabNavigation;