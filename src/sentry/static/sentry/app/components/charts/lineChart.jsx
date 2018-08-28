import moment from 'moment';
import React from 'react';

import theme from 'app/utils/theme';
import SentryTypes from 'app/sentryTypes';

import BaseChart from './baseChart';
import XAxis from './components/xAxis';
import YAxis from './components/yAxis';
import LineSeries from './series/lineSeries';

export default class LineChart extends React.Component {
  static propTypes = {
    ...BaseChart.propTypes,

    /**
     * Display previous period as a line
     */
    previousPeriod: SentryTypes.SeriesUnit,
  };

  render() {
    const {series, previousPeriod, ...props} = this.props;

    return (
      <BaseChart
        {...props}
        options={{
          xAxis: XAxis({
            type: 'time',
            boundaryGap: false,
            axisLabel: {
              formatter: (value, index) => moment(value).format('MMM D'),
            },
          }),
          yAxis: YAxis({}),
          series: [
            ...series.map(s => {
              return LineSeries({
                name: s.seriesName,
                data: s.data.map(({value, name}) => [name, value]),
              });
            }),
            previousPeriod &&
              LineSeries({
                name: previousPeriod.seriesName,
                data: previousPeriod.data.map(({name, value}) => [name, value]),
                lineStyle: {
                  color: theme.gray1,
                  type: 'dotted',
                },
              }),
          ],
        }}
      />
    );
  }
}
