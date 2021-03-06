// *****************************************************************************
// Notices:
// 
// Copyright � 2019 United States Government as represented by the Administrator
// of the National Aeronautics and Space Administration.  All Rights Reserved.
// 
// Disclaimers
// 
// No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF
// ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED
// TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS, 
// ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
// OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE
// ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO
// THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN
// ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS,
// RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS
// RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY
// DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF
// PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT ''AS IS.''
// 
// Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST
// THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS
// ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN
// ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE,
// INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S
// USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE
// UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY
// PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR
// ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS
// AGREEMENT.
// *****************************************************************************
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';

import CloseIcon from '@material-ui/icons/Close';
import DeleteIcon from '@material-ui/icons/Delete';
import ListIcon from '@material-ui/icons/List';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/AddCircle';
import { lighten } from '@material-ui/core/styles/colorManipulator';

import DisplayRequirementDialog from './DisplayRequirementDialog';
import CreateRequirementDialog from './CreateRequirementDialog';
import DeleteRequirementDialog from './DeleteRequirementDialog';

import ExportIcon from '@material-ui/icons/ArrowUpward';

import VariablesView from './VariablesView';

const sharedObj = require('electron').remote.getGlobal('sharedObj');

const db = sharedObj.db;
const app = require('electron').remote.app;
const system_dbkeys = sharedObj.system_dbkeys;
let dbChangeListener = undefined;

let counter = 0;
function createData(dbkey, rev, reqid, summary, project) {
  counter += 1;
  return { rowid: counter, dbkey, rev, reqid, summary, project };
}

function desc(a, b, orderBy) {
  var element_a, element_b
  if (rows.find(r => r.id == orderBy).numeric) {
    element_a = a[orderBy]
    element_b = b[orderBy]
  } else {
    element_a = a[orderBy].toLowerCase().trim()
    element_b = b[orderBy].toLowerCase().trim()
  }

  if (element_b < element_a)
    return -1
  if (element_b > element_a)
    return 1
  return 0
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const rows = [
  { id: 'reqid', numeric: false, disablePadding: false, label: 'ID' },
  { id: 'add', numeric: false, disablePadding: false, label: '' },
  { id: 'summary', numeric: false, disablePadding: false, label: 'Summary' },
  { id: 'project', numeric: false, disablePadding: false, label: 'Project' },
];

class SortableTableHead extends React.Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property);
  };

  render() {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, enableBulkChange } = this.props;

    return (
      <TableHead>
        <TableRow>
          {
            enableBulkChange &&
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={numSelected > 0 && numSelected < rowCount}
                checked={numSelected === rowCount}
                onChange={onSelectAllClick}
              />
            </TableCell>
          }
          {rows.map(row => {
            return (
              <TableCell
                key={row.id}
                align={row.numeric?'right':'left'}
                sortDirection={orderBy === row.id ? order : false}
              >
                <Tooltip
                  title="Sort"
                  placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === row.id}
                    direction={order}
                    onClick={this.createSortHandler(row.id)}
                  >
                    {row.label}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            );
          }, this)}
        </TableRow>
      </TableHead>
    );
  }
}

SortableTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
  enableBulkChange: PropTypes.bool.isRequired
};

const toolbarStyles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  spacer: {
    flex: '1 1 100%',
  },
  actions: {
    color: theme.palette.text.secondary,
  },
  title: {
    flex: '0 0 auto',
  },
  toolbar: {
    display: 'flex',
    flexWrap:'nowrap'
  }
});

let TableToolbar = props => {
  const { numSelected, classes, enableBulkChange, bulkChangeEnabler, deleteSelection, handleCoCoSpecWindow } = props;

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      <div className={classes.title}>
        {
          enableBulkChange &&
          <Typography color="inherit" variant="subtitle1">
            {numSelected} selected
          </Typography>
        }
      </div>
      <div className={classes.spacer} />
      <div className={classes.actions}>
        {numSelected > 0 ? (
          <div className={classes.toolbar}>
            <Tooltip title="Bulk Edit">
              <IconButton aria-label="Bulk Edit">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                aria-label="Delete"
                onClick={() =>  deleteSelection()}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => handleCoCoSpecWindow()}>
              <Tooltip title='Export Verification Code'>
                <ExportIcon/>
              </Tooltip>
            </IconButton>
            <Tooltip title="Exit Bulk Change">
              <IconButton aria-label="Close Bulk Change" onClick={() => bulkChangeEnabler()}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </div>
        ) : (
          <div className={classes.toolbar}>
          <IconButton aria-label="Export Verification Code" onClick={() => handleCoCoSpecWindow()}>
            <Tooltip title='Export Verification Code'>
              <ExportIcon color='secondary'/>
            </Tooltip>
          </IconButton>
          <IconButton aria-label="Bulk Change" onClick={() => bulkChangeEnabler()}>
            <Tooltip title="Bulk Change">
            <ListIcon color='secondary'/>
            </Tooltip>
          </IconButton>
          </div>
        )}
      </div>
    </Toolbar>
  );
};

TableToolbar.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  enableBulkChange: PropTypes.bool.isRequired,
  bulkChangeEnabler: PropTypes.func.isRequired,
  handleCoCoSpecWindow: PropTypes.func.isRequired
};




TableToolbar = withStyles(toolbarStyles)(TableToolbar);

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 1020,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
});

class SortableTable extends React.Component {
  state = {
    order: 'asc',
    orderBy: 'reqid',
    selected: [],
    data: [],
    page: 0,
    rowsPerPage: 10,
    displayRequirementOpen: false,
    selectedRequirement: {},
    selectionBulkChange: [],
    snackBarDisplayInfo: {},
    addChildRequirementMode: undefined,
    createDialogOpen: false,
    deleteDialogOpen: false,
    snackbarOpen: false,
    selectedProject: 'All Projects',
    bulkChangeMode: false,
    cocospecMode: false
  };

  constructor(props){
    super(props);
      dbChangeListener = db.changes({
        since: 'now',
        live: true,
        include_docs: true
      }).on('change', (change) => {
        if (!system_dbkeys.includes(change.id)) {
          console.log(change);
          this.synchStateWithDB();
        }
      }).on('complete', function(info) {
        console.log(info);
      }).on('error', function (err) {
        console.log(err);
      });
  }

  componentDidMount() {
    this.mounted = true;
    this.synchStateWithDB();
  }

  componentWillUnmount() {
    this.mounted = false;
    dbChangeListener.cancel();
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedProject !== prevProps.selectedProject) {
      this.synchStateWithDB()
      this.setState(
        {
          selected: [],
          bulkChangeMode: false
        });
    }
  }

  synchStateWithDB() {
    if (!this.mounted) return;

    const { selectedProject } = this.props
    const filterOff = selectedProject == 'All Projects'

    db.allDocs({
      include_docs: true,
    }).then((result) => {
      this.setState({
        data: result.rows
                .filter(r => !system_dbkeys.includes(r.key))
                .filter(r => filterOff || r.doc.project == selectedProject)
                .map(r => {
                  return createData(r.doc._id, r.doc._rev, r.doc.reqid, r.doc.fulltext, r.doc.project)
                })
                .sort((a, b) => {return a.reqid > b.reqid})
      })
    }).catch((err) => {
      console.log(err);
    });
  }

  handleCoCoSpecWindow = () => {
    const { classes, selectedProject } = this.props;
    this.setState({
      cocospecMode : !this.state.cocospecMode
    })
  }

  handleEnableBulkChange = () => {
    // Clear selection when exiting bulk change mode
    if (this.state.bulkChangeMode) {
      this.state.selected = []
    }
    this.setState({
      bulkChangeMode : !this.state.bulkChangeMode
    })
  }

  handleDeleteSelectedRequirements = () => {
    const { selected, data } = this.state
    this.setState({
      deleteDialogOpen: true,
      selectionBulkChange: data.filter(r => selected.includes(r.dbkey))
    })
  }

  handleRequirementDialogOpen = (row) => {
    if (row.dbkey) {
      db.get(row.dbkey).then((doc) => {
        doc.dbkey = row.dbkey
        doc.rev = row.rev
        this.setState({
          selectedRequirement: doc,
          displayRequirementOpen: true,
        })
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  handleRequirementDialogClose = () => {
    this.setState({
      displayRequirementOpen: false,
      addChildRequirement: false
    })
  }

  handleCreateDialogOpen = () => {
    this.setState({
      createDialogOpen: true
    })
  }

  handleAddChildRequirement = (selectedReqId, parentProject) => {
    this.setState({
      createDialogOpen: true,
      selectedRequirement: {},
      addChildRequirementMode: {
        parentReqId: selectedReqId,
        parentProject: parentProject
      }
    })
  }

  handleDeleteDialogClose = () => {
    this.setState({
      deleteDialogOpen: false
    })
    // Clear selection when exiting bulk change mode
    if (this.state.bulkChangeMode) {
      this.setState({
        selected : []
      })
    }
  }

  handleDeleteDialogOpen = () => {
    this.setState({
      deleteDialogOpen: true
    })
  }

  handleCreateDialogClose = (requirementUpdated, newReqId, actionLabel) => {
    this.setState({
      createDialogOpen: false,
      snackbarOpen: requirementUpdated,
      snackBarDisplayInfo: {
        modifiedReqId: newReqId,
        action: actionLabel
      },
      addChildRequirementMode: undefined
    })
  }

  handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ snackbarOpen: false });
  };

  handleRequestSort = (event, property) => {
    const orderBy = property;
    let order = 'desc';

    if (this.state.orderBy === property && this.state.order === 'desc') {
      order = 'asc';
    }

    this.setState({ order, orderBy });
  };

  handleSelectAllClick = event => {
    if (event.target.checked) {
      this.setState(state => ({ selected: state.data.map(n => n.dbkey) }));
      return;
    }
    this.setState({ selected: [] });
  };

  handleClick = (event, id) => {
    const { selected } = this.state;
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    this.setState({ selected: newSelected });
  };

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  isSelected = id => this.state.selected.indexOf(id) !== -1;

  render() {
    const { classes, selectedProject, existingProjectNames } = this.props;
    const { data, order, orderBy, selected, rowsPerPage, page, bulkChangeMode, cocospecMode, snackBarDisplayInfo, selectionBulkChange, selectedRequirement } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
    const title = 'Requirements: ' + selectedProject
    const selectionForDeletion = bulkChangeMode ? selectionBulkChange : [selectedRequirement]

    if (this.state.cocospecMode){
        return  <VariablesView selectedProject={selectedProject} existingProjectNames={existingProjectNames}/> };
    return (
      <div>
      <Typography variant='h6'>{title}
      </Typography>
      <Paper className={classes.root}>
        <TableToolbar
          numSelected={selected.length}
          enableBulkChange={bulkChangeMode}
          enableCoCoSpec={cocospecMode}
          bulkChangeEnabler={this.handleEnableBulkChange}
          deleteSelection={this.handleDeleteSelectedRequirements}
          handleCoCoSpecWindow={this.handleCoCoSpecWindow}/>
        <div className={classes.tableWrapper}>
          <Table className={classes.table} aria-labelledby="tableTitle" padding="dense">
            <SortableTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={this.handleSelectAllClick}
              onRequestSort={this.handleRequestSort}
              rowCount={data.length}
              enableBulkChange={bulkChangeMode}
              enableCoCoSpec={cocospecMode}
            />
            <TableBody>{
                stableSort(data, getSorting(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(n => {
                  const isSelected = this.isSelected(n.dbkey);
                  const label = n.reqid ? n.reqid : 'NONE'
                  if (this.state.bulkChangeMode) {
                    return (
                      <TableRow
                        hover
                        onClick={event => this.handleClick(event, n.dbkey)}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={-1}
                        key={n.dbkey}
                        selected={isSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isSelected} />
                        </TableCell>
                        <TableCell>
                          <Button color='secondary' onClick={() => this.handleRequirementDialogOpen(n)}>
                            {label}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Add Child Requirement">
                            <IconButton
                              aria-label="Add Child Requirement"
                              onClick={() => this.handleAddChildRequirement(n.reqid, n.project)}>
                              <AddIcon/>
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{n.summary}</TableCell>
                        <TableCell>{n.project}</TableCell>
                      </TableRow>
                    );
                  } else {
                    return (
                      <TableRow key={n.rowid}>
                        <TableCell>
                            <Button color='secondary' onClick={() => this.handleRequirementDialogOpen(n)}>
                              {label}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Add Child Requirement">
                              <IconButton
                                aria-label="Add Child Requirement"
                                onClick={() => this.handleAddChildRequirement(n.reqid, n.project)}>
                                <AddIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        <TableCell>{n.summary}</TableCell>
                        <TableCell>{n.project}</TableCell>
                      </TableRow>
                    )
                  }
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 49 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          backIconButtonProps={{
            'aria-label': 'Previous Page',
          }}
          nextIconButtonProps={{
            'aria-label': 'Next Page',
          }}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </Paper>
      <DisplayRequirementDialog
        selectedRequirement={this.state.selectedRequirement}
        open={this.state.displayRequirementOpen}
        handleDialogClose={this.handleRequirementDialogClose}
        handleCreateDialogOpen={this.handleCreateDialogOpen}
        handleDeleteDialogClose={this.handleDeleteDialogClose}
        handleDeleteDialogOpen={this.handleDeleteDialogOpen}/>
      <CreateRequirementDialog
        open={this.state.createDialogOpen}
        handleCreateDialogClose={this.handleCreateDialogClose}
        selectedProject={this.state.selectedProject}
        editRequirement={this.state.selectedRequirement}
        addChildRequirementToParent={this.state.addChildRequirementMode}
        existingProjectNames={this.props.existingProjectNames} />
      <DeleteRequirementDialog
        open={this.state.deleteDialogOpen}
        requirementsToBeDeleted={selectionForDeletion}
        handleDialogClose={this.handleDeleteDialogClose}
      />
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={this.state.snackbarOpen}
        autoHideDuration={6000}
        onClose={this.handleSnackbarClose}
        snackbarcontentprops={{
          'aria-describedby': 'message-id',
        }}
        message={<span id="message-id">Requirement Updated</span>}
        action={[
          <Button key="undo" color="secondary" size="small" onClick={this.handleSnackbarClose}>
            {this.state.snackBarDisplayInfo.modifiedReqId}
          </Button>,
          <IconButton
            key="close"
            aria-label="Close"
            color="inherit"
            onClick={this.handleSnackbarClose}
          >
            <CloseIcon />
          </IconButton>,
        ]} />
      </div>
    );
  }
}

SortableTable.propTypes = {
  classes: PropTypes.object.isRequired,
  selectedProject: PropTypes.string.isRequired,
  existingProjectNames: PropTypes.array.isRequired
};

export default withStyles(styles)(SortableTable);
