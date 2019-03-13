import React, { Component } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { SplitBackground } from '../component/background';
import { Header, Title } from '../component/header';
import Text from '../component/text';
import { Button, BackButton } from '../component/button';
import { createStyles, maxWidth } from '../component/media-query';
import { color, font, breakWidth } from '../component/style';

//
// CLI View
//

const styles = StyleSheet.create({
  header: {
    marginBottom: 1, // display separator above output background color
  },
});

const CLIView = ({ store, nav }) => (
  <SplitBackground color={color.blackDark} bottom={color.cliBackground}>
    <Header separator style={styles.header}>
      <BackButton onPress={() => nav.goSettings()} />
      <Title title="Logs" />
      <Button disabled onPress={() => {}} />
    </Header>
    <LogOutput logs={store.logs} />
  </SplitBackground>
);

CLIView.propTypes = {
  store: PropTypes.object.isRequired,
  nav: PropTypes.object.isRequired,
};

//
// Log Output
//

const baseLogStyles = {
  content: {
    flexGrow: 1,
    backgroundColor: color.cliBackground,
    paddingTop: 25,
    paddingBottom: 25,
    paddingLeft: 50,
    paddingRight: 50,
  },
  text: {
    fontSize: font.sizeS,
  },
};

const logStyles = createStyles(
  baseLogStyles,

  maxWidth(breakWidth, {
    content: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  })
);

class LogOutput extends Component {
  constructor(props) {
    super(props);
    this._refresh = true;
    this._ref = React.createRef();
    this.state = {
      maxOffset: undefined,
    }
  }

//  shouldComponentUpdate() {
//    const current = this._refresh;
//    this._refresh = false;
//    setTimeout(() => {
//      this._refresh = true;
//    }, 100);
//    if (!current) {
//      clearTimeout(this._tLast);
//      this._tLast = setTimeout(() => this.forceUpdate(), 500);
//    }
//    return current;
//  }

  componentWillUnmount() {
    clearTimeout(this._tLast);
    clearTimeout(this._tScroll);
  }

  onScroll(scrollEvent) {
    const offset = scrollEvent.nativeEvent.contentOffset.y;
//    console.log(`offset: ${offset}, maxOffset: ${this.state.maxOffset}, contentHeight: ${scrollEvent.nativeEvent.contentSize.height}`);
    if (this.state.maxOffset === undefined || this.state.maxOffset <= offset) {
      this.setState({ maxOffset: offset - 10 })
//      console.log("about to set timeout to stay scrolled to the end")
      if (this._tScroll === undefined) {
         this._tScroll = setInterval(() => {
//         console.log("scrolling to end")
           this._ref.current.scrollToEnd()
         }, 1000);
      }
    } else if (offset < this.state.maxOffset && this._tScroll) {
//      console.log("clearing timeout for scroll")
      clearInterval(this._tScroll);
      this._tScroll = undefined;
    }
  }

  render() {
      console.log("render called")
    return (
      <ScrollView
        ref={this._ref}
        onScroll={event => this.onScroll(event)}
        scrollEventThrottle={300}
        contentContainerStyle={logStyles.content}
      >
        {this.props.logs.map(log =>
          <Text style={logStyles.txt}>{log}</Text>
        )}
      </ScrollView>
    );
  }
}

LogOutput.propTypes = {
  logs: PropTypes.object.isRequired,
};

export default observer(CLIView);
