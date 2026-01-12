import { useState, useEffect, useRef } from 'react';
import { Users, Building, Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import api from '../../api/axios';

export default function OrganizationalChart() {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('hierarchy'); // hierarchy, departments
  const chartRef = useRef(null);

  useEffect(() => {
    loadOrganizationalChart();
  }, []);

  const loadOrganizationalChart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees/organizational-chart');
      setOrgData(response.data);
    } catch (error) {
      console.error('Error loading organizational chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNodes = (nodes) => {
    if (!nodes) return [];
    
    let filtered = nodes;
    
    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(node => node.department === selectedDepartment);
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(node => 
        node.name.toLowerCase().includes(searchLower) ||
        node.position.toLowerCase().includes(searchLower) ||
        node.email.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const buildHierarchy = (nodes, edges) => {
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node, children: [] }]));
    const roots = [];
    
    // Build parent-child relationships
    edges.forEach(edge => {
      const parent = nodeMap.get(edge.from);
      const child = nodeMap.get(edge.to);
      if (parent && child) {
        parent.children.push(child);
      }
    });
    
    // Find root nodes (nodes without parents)
    nodes.forEach(node => {
      const hasParent = edges.some(edge => edge.to === node.id);
      if (!hasParent) {
        roots.push(nodeMap.get(node.id));
      }
    });
    
    return roots;
  };

  const renderHierarchyNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node */}
        <div className={`bg-white rounded-lg shadow-md border-2 p-4 m-2 min-w-[200px] ${
          level === 0 ? 'border-blue-500' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            {node.profile_image ? (
              <img
                src={node.profile_image}
                alt={node.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{node.name}</h3>
              <p className="text-xs text-gray-600">{node.position}</p>
              <p className="text-xs text-blue-600">{node.department}</p>
            </div>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && (
          <div className="flex flex-col items-center">
            {/* Connector Line */}
            <div className="w-px h-4 bg-gray-300"></div>
            
            {/* Children Container */}
            <div className="flex flex-wrap justify-center">
              {node.children.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Horizontal connector for multiple children */}
                  {node.children.length > 1 && (
                    <div className="flex items-center">
                      <div className={`h-px bg-gray-300 ${index === 0 ? 'w-2' : 'w-4'}`}></div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className={`h-px bg-gray-300 ${index === node.children.length - 1 ? 'w-2' : 'w-4'}`}></div>
                    </div>
                  )}
                  
                  {renderHierarchyNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDepartmentView = () => {
    if (!orgData) return null;
    
    const departments = Object.keys(orgData.departments);
    const filteredDepartments = selectedDepartment === 'all' 
      ? departments 
      : [selectedDepartment];
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDepartments.map(dept => {
          const employees = orgData.departments[dept].filter(emp => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return emp.name.toLowerCase().includes(searchLower) ||
                   emp.position.toLowerCase().includes(searchLower) ||
                   emp.email.toLowerCase().includes(searchLower);
          });
          
          if (employees.length === 0) return null;
          
          return (
            <div key={dept} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{dept}</h3>
                  <span className="text-sm text-gray-500">({employees.length})</span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    {employee.profile_image ? (
                      <img
                        src={employee.profile_image}
                        alt={employee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{employee.name}</h4>
                      <p className="text-xs text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No organizational data found</h3>
        <p className="text-gray-600">Unable to load organizational chart</p>
      </div>
    );
  }

  const filteredNodes = filterNodes(orgData.nodes);
  const hierarchyRoots = buildHierarchy(filteredNodes, orgData.edges);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizational Chart</h1>
          <p className="text-gray-600">View company structure and reporting relationships</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'hierarchy' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hierarchy
          </button>
          <button
            onClick={() => setViewMode('departments')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'departments' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Departments
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {Object.keys(orgData.departments).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white rounded-lg shadow-sm border min-h-[500px]">
        {viewMode === 'hierarchy' ? (
          <div ref={chartRef} className="p-6 overflow-auto">
            {hierarchyRoots.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-8">
                {hierarchyRoots.map(root => renderHierarchyNode(root))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            {renderDepartmentView()}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Total Employees</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{orgData.nodes.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Departments</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(orgData.departments).length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Managers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {orgData.edges.reduce((acc, edge) => {
              acc.add(edge.from);
              return acc;
            }, new Set()).size}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Direct Reports</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{orgData.edges.length}</p>
        </div>
      </div>
    </div>
  );
}